import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { ENEMY_STATES, ANIMATION_STATES } from '../utils/constants.js';

export class PatrolAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);
    }

    update(dt) {
        this.groundPatrol.update(dt);

        if (this.enemy.type === 'slime') {
            this.renderable.animationState = ANIMATION_STATES.IDLE_RUN;
        } else {
            this.renderable.animationState = this.state.currentState === ENEMY_STATES.PATROL ? ANIMATION_STATES.RUN : ANIMATION_STATES.IDLE;
        }
    }
}