import { FlyingAI } from './FlyingAI.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS } from '../utils/constants.js';

export class FlyingPatrolAI extends FlyingAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);


        this.anchorX = this.pos.x + this.col.width / 2;


        this.patrolDistance = this.enemy.ai.patrolDistance || 200;
        this.horizontalSpeed = this.enemy.ai.horizontalSpeed || 60;

        this.turnDuration = this.enemy.ai.turnDuration || 1;
        this.acceleration = this.enemy.ai.acceleration || 120;
        
        this.flapFrames = [5];


        this.state.currentState = ENEMY_STATES.PATROL;
        this.enemy.timer = 0;
    }

    update(dt) {
        this.renderable.animationState = ANIMATION_STATES.FLYING;

        this.handleAnimationEvents();
        this.updateVerticalBobbing(dt);

        switch (this.state.currentState) {
            case ENEMY_STATES.PATROL:
                this._patrol(dt);
                break;
            case 'turning':
                this._turn(dt);
                break;
        }
    }

    _patrol(dt) {
        const directionMultiplier = this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1;


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

            this.state.currentState = 'turning';
            this.enemy.turnTimer = this.turnDuration;
        }
    }

    _turn(dt) {
        this.enemy.turnTimer -= dt;

        const turnDirectionMultiplier = this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1;
        this.vel.vx -= turnDirectionMultiplier * (this.horizontalSpeed * 0.5) * dt;

        if (this.enemy.turnTimer <= 0) {
            this.renderable.direction = this.renderable.direction === DIRECTIONS.RIGHT ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT;
            this.state.currentState = ENEMY_STATES.PATROL;
        }
    }
}