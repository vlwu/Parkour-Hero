import { PlayerBaseState } from './PlayerBaseState.js';
import { PLAYER_CONSTANTS } from '../../utils/constants.js';
import { RenderableComponent } from '../../components/RenderableComponent.js';
import { StateComponent } from '../../components/StateComponent.js';
import { PlayerControlledComponent } from '../../components/PlayerControlledComponent.js';

export class DespawnState extends PlayerBaseState {
    enter() {
        const renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        const state = this.entityManager.getComponent(this.entityId, StateComponent);
        const ctrl = this.entityManager.getComponent(this.entityId, PlayerControlledComponent);
        
        ctrl.isDespawning = true;
        state.currentState = 'despawn';
        renderable.animationState = 'despawn';
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
        renderable.width = PLAYER_CONSTANTS.SPAWN_WIDTH;
        renderable.height = PLAYER_CONSTANTS.SPAWN_HEIGHT;
    }
}