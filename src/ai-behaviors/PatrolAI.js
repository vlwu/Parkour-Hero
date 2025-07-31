import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';

export class PatrolAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);
    }

    update(dt) {
        this.groundPatrol.update(dt);

        if (this.enemy.type === 'slime') {
            this.renderable.animationState = 'idle_run';
        } else {
            this.renderable.animationState = this.state.currentState === 'patrol' ? 'run' : 'idle';
        }
    }
}