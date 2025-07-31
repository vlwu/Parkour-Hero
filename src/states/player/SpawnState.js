import { PlayerBaseState } from './PlayerBaseState.js';
import { IdleState } from './IdleState.js';
import { PLAYER_CONSTANTS } from '../../utils/constants.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { StateComponent } from '../../components/StateComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';

export class SpawnState extends PlayerBaseState {
    enter() {
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);
        
        state.currentState = 'spawn';
        renderable.animationState = 'spawn';
        ctrl.isSpawning = true;
    }

    update(dt) {
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);
        if (ctrl.spawnComplete) {
            return new IdleState(this.entityId, this.entityManager);
        }
        return null;
    }
}