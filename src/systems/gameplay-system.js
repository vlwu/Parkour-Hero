import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class GameplaySystem {
    constructor() {
        eventBus.subscribe('collisionEvent', (e) => this.handleCollision(e));
    }

    /**
     * Translates a raw collision event into a specific gameplay action.
     * @param {object} event The collision event data.
     * @param {'fruit'|'hazard'|'trophy'|'checkpoint'|'world_bottom'} event.type The type of the collision target.
     * @param {number} event.entityId The ID of the entity that initiated the collision (e.g., the player).
     * @param {object} [event.target] The object that was collided with (e.g., the fruit object).
     * @param {EntityManager} event.entityManager The entity manager instance.
     */
    // FIX: Correctly destructure the 'entityManager' from the event payload 'e'.
    handleCollision({ type, entityId, target, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityId, PlayerControlledComponent);
        if (!isPlayer) return;

        switch (type) {
            case 'fruit':
                eventBus.publish('fruitCollected', target);
                break;
            // FIX: Add a case for the new 'world_bottom' event.
            case 'world_bottom':
            case 'hazard':
                eventBus.publish('playerDied');
                break;
            case 'trophy':
                eventBus.publish('trophyCollision');
                break;
            case 'checkpoint':
                eventBus.publish('checkpointActivated', target);
                break;
        }
    }

    update(dt, context) {}
}