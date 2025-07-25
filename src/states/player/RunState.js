import { PlayerBaseState } from './PlayerBaseState.js';
import { IdleState } from './IdleState.js';
import { FallState } from './FallState.js';
import { StateComponent } from '../../components/StateComponent.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';
import { CollisionComponent } from '../../components/CollisionComponent.js';
import { VelocityComponent } from '../../components/VelocityComponent.js';

export class RunState extends PlayerBaseState {
    enter() {
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);

        state.currentState = 'run';
        renderable.animationState = 'run';
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
        ctrl.jumpCount = 0;
    }

    update(dt) {
        const col = this.entityManager.getComponent(this.entityId, CollisionComponent);
        const vel = this.entityManager.getComponent(this.entityId, VelocityComponent);

        if (Math.abs(vel.vx) < 1) {
            return new IdleState(this.entityId, this.entityManager);
        }

        if (!col.isGrounded) {
            return new FallState(this.entityId, this.entityManager);
        }
        return null;
    }
}