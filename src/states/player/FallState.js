import { PlayerBaseState } from './PlayerBaseState.js';
import { IdleState } from './IdleState.js';
import { ClingState } from './ClingState.js';
import { RunState } from './RunState.js';
import { StateComponent } from '../../components/StateComponent.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { CollisionComponent } from '../../components/CollisionComponent.js';
import { VelocityComponent } from '../../components/VelocityComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';

export class FallState extends PlayerBaseState {
    enter() {
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        state.currentState = 'fall';
        renderable.animationState = 'fall';
    }

    update(dt) {
        const col = this.entityManager.getComponent(this.entityId, CollisionComponent);
        const vel = this.entityManager.getComponent(this.entityId, VelocityComponent);
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);

        if (col.isGrounded) {
            return Math.abs(vel.vx) > 1 
                ? new RunState(this.entityId, this.entityManager) 
                : new IdleState(this.entityId, this.entityManager);
        }

        if (col.isAgainstWall && ctrl.coyoteTimer <= 0 && vel.vy >= 0) {
            return new ClingState(this.entityId, this.entityManager);
        }
        return null;
    }
}