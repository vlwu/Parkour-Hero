import { PlayerBaseState } from './PlayerBaseState.js';
import { FallState } from './FallState.js';
import { StateComponent } from '../../components/StateComponent.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';

export class DashState extends PlayerBaseState {
    enter() {
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        state.currentState = 'dash';
        renderable.animationState = 'dash';
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
    }

    update(dt) {
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);
        if (!ctrl.isDashing) {
            return new FallState(this.entityId, this.entityManager);
        }
        return null;
    }
}