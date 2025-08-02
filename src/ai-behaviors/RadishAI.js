import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { BoxPatrol } from './BoxPatrol.js';
import { ENEMY_STATES, ANIMATION_STATES, EVENTS } from '../utils/constants.js';

export class RadishAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.boxPatrol = new BoxPatrol(entityId, entityManager, level, playerEntityId);
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
        this.boxPatrol.update(dt);
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