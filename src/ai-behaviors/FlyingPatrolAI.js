import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';

export class FlyingPatrolAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);


        this.anchorX = this.pos.x + this.col.width / 2;
        this.anchorY = this.pos.y;


        this.patrolDistance = this.enemy.ai.patrolDistance || 200;
        this.horizontalSpeed = this.enemy.ai.horizontalSpeed || 60;
        this.verticalAmplitude = this.enemy.ai.verticalAmplitude || 10;
        
        this.gravity = 80;
        this.flapForce = -150;
        this.tetherStrength = 5;

        this.turnDuration = 1.0;
        this.acceleration = 120;


        this.state.currentState = 'patrolling';
        this.enemy.timer = 0;
        this.lastFrame = -1;
    }

    update(dt) {
        this.renderable.animationState = 'flying';

        this._handleAnimationEvents();

        switch (this.state.currentState) {
            case 'patrolling':
                this._patrol(dt);
                break;
            case 'turning':
                this._turn(dt);
                break;
        }


        this.vel.vy += this.gravity * dt;


        const distY = this.pos.y - this.anchorY;
        if (Math.abs(distY) > this.verticalAmplitude) {
            this.vel.vy -= distY * this.tetherStrength * dt;
        }
        
        this.vel.vy = Math.max(-200, Math.min(200, this.vel.vy));
    }

    _patrol(dt) {
        const directionMultiplier = this.renderable.direction === 'right' ? 1 : -1;


        const leftBound = this.anchorX - this.patrolDistance / 2;
        const rightBound = this.anchorX + this.patrolDistance / 2;
        const currentXCenter = this.pos.x + this.col.width / 2;


        const slowDownDistance = 60;
        let targetSpeed = this.horizontalSpeed;


        if (directionMultiplier > 0 && (rightBound - currentXCenter) < slowDownDistance) {
            const speedMultiplier = Math.max(0.1, (rightBound - currentXCenter) / slowDownDistance);
            targetSpeed *= speedMultiplier;
        } else if (directionMultiplier < 0 && (currentXCenter - leftBound) < slowDownDistance) {
            const speedMultiplier = Math.max(0.1, (currentXCenter - leftBound) / slowDownDistance);
            targetSpeed *= speedMultiplier;
        }

        const finalTargetSpeed = targetSpeed * directionMultiplier;


        if (this.vel.vx < finalTargetSpeed && directionMultiplier > 0) {
            this.vel.vx = Math.min(finalTargetSpeed, this.vel.vx + this.acceleration * dt);
        } else if (this.vel.vx > finalTargetSpeed && directionMultiplier < 0) {
            this.vel.vx = Math.max(finalTargetSpeed, this.vel.vx - this.acceleration * dt);
        } else {

            this.vel.vx = finalTargetSpeed;
        }


        if ((directionMultiplier > 0 && currentXCenter >= rightBound) || (directionMultiplier < 0 && currentXCenter <= leftBound)) {

            this.pos.x = directionMultiplier > 0 ? (rightBound - this.col.width / 2) : (leftBound - this.col.width / 2);
            this.vel.vx = 0;
            this.state.currentState = 'turning';
            this.enemy.turnTimer = this.turnDuration;
        }
    }

    _turn(dt) {
        this.enemy.turnTimer -= dt;
        if (this.enemy.turnTimer <= 0) {
            this.renderable.direction = this.renderable.direction === 'right' ? 'left' : 'right';
            this.state.currentState = 'patrolling';
        }
    }

    _handleAnimationEvents() {
        const currentFrame = this.renderable.animationFrame;

        if (currentFrame !== this.lastFrame && currentFrame === 5) {
            this.vel.vy = this.flapForce;

            const particleX = this.pos.x + this.col.width / 2;
            const particleY = this.pos.y + this.col.height;

            eventBus.publish('createParticles', {
                x: particleX,
                y: particleY,
                type: 'wing_flap',
            });
        }
        this.lastFrame = currentFrame;
    }
}