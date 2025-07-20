import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class GameplaySystem {
    constructor() {
        // Listen for generic collision events published by the CollisionSystem.
        eventBus.subscribe('collisionEvent', (e) => this.handleCollision(e));
    }

    /**
     * Translates a raw collision event into a specific gameplay action.
     * @param {object} event The collision event data.
     * @param {'fruit'|'hazard'|'trophy'|'checkpoint'} event.type The type of the collision target.
     * @param {number} event.entityId The ID of the entity that initiated the collision (e.g., the player).
     * @param {object} event.target The object that was collided with (e.g., the fruit object).
     */
    handleCollision({ type, entityId, target, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityId, PlayerControlledComponent);
        if (!isPlayer) return; // For now, only the player can trigger these events.

        switch (type) {
            case 'fruit':
                // Re-publish the specific event the engine is listening for.
                eventBus.publish('fruitCollected', target);
                break;
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

    // This system is purely event-driven, so its update loop is empty.
    update(dt, context) {}
}