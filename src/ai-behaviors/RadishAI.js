import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { BoxPatrol } from './BoxPatrol.js';
import { ENEMY_STATES, ANIMATION_STATES } from '../utils/constants.js';
import { FallStateComponent } from '../components/FallStateComponent.js';

export class RadishAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.boxPatrol = new BoxPatrol(entityId, entityManager, level, playerEntityId);
        this.groundPatrolBehavior = null;
    }

    update(dt) {
        const fall = this.entityManager.getComponent(this.entityId, FallStateComponent);
        if (!fall) return;

        if (fall.isGrounded) {
            this._updateGrounded(dt);
        } else if (fall.isFalling) {
            this._updateFalling(dt, fall);
        } else {
            this._updateFlying(dt);
        }
    }

    _updateFlying(dt) {
        this.renderable.animationState = ANIMATION_STATES.IDLE1;
        this.state.currentState = ENEMY_STATES.FLYING;
        this.boxPatrol.update(dt);
    }

    _updateFalling(dt, fall) {
        this.renderable.animationState = ANIMATION_STATES.IDLE1;
        this.state.currentState = ENEMY_STATES.FALLING;
        this.vel.vx = 0;
        this.vel.vy += 600 * dt;

        if (this.col.isGrounded) {
            fall.isFalling = false;
            fall.isGrounded = true;
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