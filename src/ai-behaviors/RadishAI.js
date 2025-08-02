import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS } from '../utils/constants.js';

export class RadishAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.patrolBoxSize = this.enemy.ai.patrolBoxSize || 150;
        this.airSpeed = this.enemy.ai.airSpeed || 50;

        this.anchorX = this.pos.x + this.col.width / 2;
        this.anchorY = this.pos.y + this.col.height / 2;
        this.targetX = this.anchorX;
        this.targetY = this.anchorY;
        this.moveTimer = 0;
        this.groundPatrolBehavior = null;

        if (!this.enemy.radishState) {
            this.enemy.radishState = ENEMY_STATES.FLYING;
        }
    }

    update(dt) {
        if (this.enemy.radishState === ENEMY_STATES.FLYING) {
            this._updateFlying(dt);
        } else if (this.enemy.radishState === ENEMY_STATES.FALLING) {
            this._updateFalling(dt);
        } else if (this.enemy.radishState === ENEMY_STATES.GROUNDED) {
            this._updateGrounded(dt);
        }
    }

    _updateFlying(dt) {
        this.renderable.animationState = ANIMATION_STATES.IDLE1;
        this.state.currentState = ENEMY_STATES.FLYING;

        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.targetX = this.anchorX + (Math.random() - 0.5) * this.patrolBoxSize;
            this.targetY = this.anchorY + (Math.random() - 0.5) * this.patrolBoxSize;
            this.moveTimer = Math.random() * 2 + 1;
        }

        const dx = this.targetX - (this.pos.x + this.col.width / 2);
        const dy = this.targetY - (this.pos.y + this.col.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.vel.vx = (dx / dist) * this.airSpeed;
            this.vel.vy = (dy / dist) * this.airSpeed;
        } else {
            this.vel.vx = 0;
            this.vel.vy = 0;
        }

        if (Math.abs(this.vel.vx) > 0.1) {
            this.renderable.direction = this.vel.vx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        }
    }

    _updateFalling(dt) {
        this.renderable.animationState = ANIMATION_STATES.IDLE1;
        this.state.currentState = ENEMY_STATES.FALLING;
        this.vel.vx = 0;
        this.vel.vy += 600 * dt;

        if (this.col.isGrounded) {
            this.enemy.radishState = ENEMY_STATES.GROUNDED;
            this.state.currentState = ENEMY_STATES.IDLE_GROUNDED;
            this.renderable.animationState = ANIMATION_STATES.IDLE2;
            this.renderable.animationFrame = 0;
            this.vel.vy = 0;
            this.groundPatrolBehavior = new GroundPatrol(this.entityId, this.entityManager, this.level, this.playerEntityId);
        }
    }

    _updateGrounded(dt) {
        if (this.groundPatrolBehavior) {
            this.groundPatrolBehavior.update(dt);
            this.renderable.animationState = this.state.currentState === ENEMY_STATES.PATROL_GROUNDED ? ANIMATION_STATES.RUN : ANIMATION_STATES.IDLE2;
        }
    }
}