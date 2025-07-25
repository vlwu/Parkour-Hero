import { PlayerBaseState } from './PlayerBaseState.js';
import { FallState } from './FallState.js';
import { StateComponent } from '../../components/StateComponent.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';
import { CollisionComponent } from '../../components/CollisionComponent.js';

export class ClingState extends PlayerBaseState {
    enter() {
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);
        
        state.currentState = 'cling';
        renderable.animationState = 'cling';
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
        ctrl.jumpCount = 1;
    }

    update(dt) {
        const col = this.entityManager.getComponent(this.entityId, CollisionComponent);
        if (!col.isAgainstWall || col.isGrounded) {
            return new FallState(this.entityId, this.entityManager);
        }
        return null;
    }
}