import { PlayerBaseState } from './PlayerBaseState.js';
import { FallState } from './FallState.js';
import { StateComponent } from '../../components/StateComponent.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { VelocityComponent } from '../../components/VelocityComponent.js';

export class DoubleJumpState extends PlayerBaseState {
    enter() {
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        state.currentState = 'double_jump';
        renderable.animationState = 'double_jump';
    }

    update(dt) {
        const vel = this.entityManager.getComponent(this.entityId, VelocityComponent);
        if (vel.vy > 0) {
            return new FallState(this.entityId, this.entityManager);
        }
        return null;
    }
}