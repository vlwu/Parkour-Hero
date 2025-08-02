import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, EVENTS } from '../utils/constants.js';

export class FlyingSlamAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.anchorY = this.pos.y;
        this.lastFrame = -1;

        this.bobbingAmplitude = this.enemy.ai.bobbingAmplitude || 8;
        this.gravity = this.enemy.ai.gravity || 120;
        this.flapForce = this.enemy.ai.flapForce || -140;
        this.tetherStrength = this.enemy.ai.tetherStrength || 5;
        this.soundRadius = this.enemy.ai.soundRadius || 200;

        this.slamSpeed = this.enemy.ai.slamSpeed || 350;
        this.retractSpeed = this.enemy.ai.retractSpeed || 100;
        this.groundedDuration = this.enemy.ai.groundedDuration || 1.0;
        this.groundedTimer = 0;

        this.state.currentState = ENEMY_STATES.IDLE;
        if (this.killable) {
            this.killable.dealsContactDamage = false;
        }
    }

    update(dt) {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        this._handleAnimationEvents(playerPos);

        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
                this._idle(dt, playerPos, playerCol);
                break;
            case ENEMY_STATES.SLAMMING:
                this._slamming(dt);
                break;
            case ENEMY_STATES.GROUNDED:
                this._grounded(dt);
                break;
            case ENEMY_STATES.RETRACTING:
                this._retracting(dt);
                break;
        }
    }

    _idle(dt, playerPos, playerCol) {
        this.renderable.animationState = ANIMATION_STATES.IDLE;
        this.vel.vx = 0;

        this.vel.vy += this.gravity * dt;
        const distY = this.pos.y - this.anchorY;
        if (Math.abs(distY) > this.bobbingAmplitude) {
            this.vel.vy -= distY * this.tetherStrength * dt;
        }
        this.vel.vy = Math.max(-200, Math.min(200, this.vel.vy));


        if (this._isPlayerInZone(playerPos, playerCol)) {
            this.state.currentState = ENEMY_STATES.SLAMMING;
            if (this.killable) {
                this.killable.dealsContactDamage = true;
            }
        }
    }

    _slamming(dt) {
        this.renderable.animationState = ANIMATION_STATES.FALL;
        this.vel.vy = this.slamSpeed;

        const groundY = this.pos.y + this.col.height + 1;
        if (this.level.isSolidAt(this.pos.x + this.col.width / 2, groundY)) {
            this.pos.y = Math.floor(groundY / GRID_CONSTANTS.TILE_SIZE) * GRID_CONSTANTS.TILE_SIZE - this.col.height;
            this.vel.vy = 0;
            this.state.currentState = ENEMY_STATES.GROUNDED;
            this.groundedTimer = this.groundedDuration;

            eventBus.publish(EVENTS.CAMERA_SHAKE_REQUESTED, { intensity: 12, duration: 0.25 });
            eventBus.publish(EVENTS.CREATE_PARTICLES, { x: this.pos.x + this.col.width / 2, y: this.pos.y + this.col.height, type: 'walk_dust', particleSpeed: 150 });
        }
    }

    _grounded(dt) {
        this.renderable.animationState = ANIMATION_STATES.GROUND;
        this.vel.vy = 0;
        if (this.killable) {
            this.killable.dealsContactDamage = false;
        }
        this.groundedTimer -= dt;
        if (this.groundedTimer <= 0) {
            this.state.currentState = ENEMY_STATES.RETRACTING;
        }
    }

    _retracting(dt) {
        this.renderable.animationState = ANIMATION_STATES.IDLE;
        this.vel.vy = -this.retractSpeed;

        if (this.pos.y <= this.anchorY) {
            this.pos.y = this.anchorY;
            this.vel.vy = 0;
            this.state.currentState = ENEMY_STATES.IDLE;
            if (this.killable) {
                this.killable.dealsContactDamage = false;
            }
        }
    }

    _isPlayerInZone(playerPos, playerCol) {
        if (!playerPos || !playerCol) return false;

        const MAX_DETECTION_DISTANCE = 500;
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;

        const zone = {
            x: this.pos.x,
            y: this.pos.y + this.col.height,
            width: this.col.width,
            height: MAX_DETECTION_DISTANCE
        };

        const playerHitbox = { x: playerPos.x, y: playerPos.y, width: playerCol.width, height: playerCol.height };

        if (playerHitbox.x + playerHitbox.width <= zone.x || playerHitbox.x >= zone.x + zone.width || playerHitbox.y < zone.y) {
            return false;
        }

        let detectionBottomY = zone.y + zone.height;
        const startGridY = Math.floor(zone.y / TILE_SIZE);
        const endGridY = Math.floor(detectionBottomY / TILE_SIZE);
        const checkGridX = Math.floor((zone.x + zone.width / 2) / TILE_SIZE);

        for (let y = startGridY; y <= endGridY; y++) {
            const tileProps = this.level.getTilePropertiesAt(checkGridX * TILE_SIZE, y * TILE_SIZE);
            if (tileProps && tileProps.solid && !tileProps.oneWay) {
                detectionBottomY = y * TILE_SIZE;
                break;
            }
        }

        const actualZone = {
            ...zone,
            height: detectionBottomY - zone.y
        };

        return (
            playerHitbox.y < actualZone.y + actualZone.height &&
            playerHitbox.y + playerHitbox.height > actualZone.y
        );
    }

    _handleAnimationEvents(playerPos) {
        const currentFrame = this.renderable.animationFrame;
        if (currentFrame !== this.lastFrame) {
            if (this.state.currentState === ENEMY_STATES.IDLE && (currentFrame === 7 || currentFrame === 8)) {
                this.vel.vy = this.flapForce;
                const particleY = this.pos.y + this.col.height / 2;
                eventBus.publish(EVENTS.CREATE_PARTICLES, { x: this.pos.x, y: particleY, type: 'wing_flap' });
                eventBus.publish(EVENTS.CREATE_PARTICLES, { x: this.pos.x + this.col.width, y: particleY, type: 'wing_flap' });
                if (playerPos) {
                    const distance = Math.sqrt(Math.pow(playerPos.x - this.pos.x, 2) + Math.pow(playerPos.y - this.pos.y, 2));
                    if (distance < this.soundRadius) {
                        eventBus.publish(EVENTS.PLAY_SOUND, { key: 'wing_flap', volume: 0.3, channel: 'SFX' });
                    }
                }
            }
        }
        this.lastFrame = currentFrame;
    }
}