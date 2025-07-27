import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import { PositionComponent } from '../components/PositionComponent.js';

export class FlyingSlamAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.anchorY = this.pos.y;
        this.lastFrame = -1;

        this.bobbingAmplitude = 8;
        this.gravity = 120;
        this.flapForce = -140;
        this.tetherStrength = 7;

        this.slamSpeed = 900;
        this.retractSpeed = 100;
        this.groundedDuration = 1.0;
        this.groundedTimer = 0;

        this.state.currentState = 'idle';
    }

    update(dt) {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        this._handleAnimationEvents();

        switch (this.state.currentState) {
            case 'idle':
                this._idle(dt, playerPos);
                break;
            case 'slamming':
                this._slamming(dt);
                break;
            case 'grounded':
                this._grounded(dt);
                break;
            case 'retracting':
                this._retracting(dt);
                break;
        }
    }

    _idle(dt, playerPos) {
        this.renderable.animationState = 'idle';
        this.vel.vx = 0;

        this.vel.vy += this.gravity * dt;
        const distY = this.pos.y - this.anchorY;
        if (Math.abs(distY) > this.bobbingAmplitude) {
            this.vel.vy -= distY * this.tetherStrength * dt;
        }
        this.vel.vy = Math.max(-200, Math.min(200, this.vel.vy));


        if (this._isPlayerInZone(playerPos)) {
            this.state.currentState = 'slamming';
        }
    }

    _slamming(dt) {
        this.renderable.animationState = 'fall';
        this.vel.vy = this.slamSpeed;

        const groundY = this.pos.y + this.col.height;
        if (this.level.isSolidAt(this.pos.x + this.col.width / 2, groundY)) {
            this.pos.y = Math.floor(groundY / GRID_CONSTANTS.TILE_SIZE) * GRID_CONSTANTS.TILE_SIZE - this.col.height;
            this.vel.vy = 0;
            this.state.currentState = 'grounded';
            this.groundedTimer = this.groundedDuration;

            eventBus.publish('cameraShakeRequested', { intensity: 12, duration: 0.25 });
            eventBus.publish('createParticles', { x: this.pos.x + this.col.width / 2, y: this.pos.y + this.col.height, type: 'walk_dust', particleSpeed: 150 });
        }
    }
    
    _grounded(dt) {
        this.renderable.animationState = 'ground';
        this.vel.vy = 0;
        this.groundedTimer -= dt;
        if (this.groundedTimer <= 0) {
            this.state.currentState = 'retracting';
        }
    }

    _retracting(dt) {
        this.renderable.animationState = 'idle';
        this.vel.vy = -this.retractSpeed;

        if (this.pos.y <= this.anchorY) {
            this.pos.y = this.anchorY;
            this.vel.vy = 0;
            this.state.currentState = 'idle';
        }
    }

    _isPlayerInZone(playerPos) {
        if (!playerPos) return false;
        
        const detectionZone = {
            x: this.pos.x,
            y: this.pos.y + this.col.height,
            width: this.col.width,
            height: 400 
        };

        return (
            playerPos.x < detectionZone.x + detectionZone.width &&
            playerPos.x + 32 > detectionZone.x &&
            playerPos.y > detectionZone.y
        );
    }
    
    _handleAnimationEvents() {
        const currentFrame = this.renderable.animationFrame;
        if (currentFrame !== this.lastFrame) {
            if (this.state.currentState === 'idle' && (currentFrame === 7 || currentFrame === 8)) {
                this.vel.vy = this.flapForce;
                const particleY = this.pos.y + this.col.height / 2;
                eventBus.publish('createParticles', { x: this.pos.x, y: particleY, type: 'wing_flap' });
                eventBus.publish('createParticles', { x: this.pos.x + this.col.width, y: particleY, type: 'wing_flap' });
            }
        }
        this.lastFrame = currentFrame;
    }
}