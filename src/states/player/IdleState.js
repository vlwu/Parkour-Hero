import { PlayerBaseState } from './PlayerBaseState.js';
import { RunState } from './RunState.js';
import { FallState } from './FallState.js';
import { StateComponent } from '../../components/StateComponent.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';
import { InputComponent } from '../../components/InputComponent.js';
import { CollisionComponent } from '../../components/CollisionComponent.js';

export class IdleState extends PlayerBaseState {
    enter() {
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);

        state.currentState = 'idle';
        renderable.animationState = 'idle';
        ctrl.jumpCount = 0;
    }

    update(dt) {
        const input = this.entityManager.getComponent(this.entityId, InputComponent);
        const col = this.entityManager.getComponent(this.entityId, CollisionComponent);

        if (input.moveLeft || input.moveRight) {
            return new RunState(this.entityId, this.entityManager);
        }

        if (!col.isGrounded) {
            return new FallState(this.entityId, this.entityManager);
        }
        return null;
    }
}