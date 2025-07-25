import { PlayerBaseState } from './PlayerBaseState.js';
import { FallState } from './FallState.js';
import { StateComponent } from '../../components/StateComponent.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';

export class HitState extends PlayerBaseState {
    enter() {
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        state.currentState = 'hit';
        renderable.animationState = 'hit';
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
    }

    update(dt) {
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);
        if (!ctrl.isHit) {
            return new FallState(this.entityId, this.entityManager);
        }
        return null;
    }
}