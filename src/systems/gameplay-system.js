import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class GameplaySystem {
    constructor() {
        // MODIFIED: Subscribe to the new, more specific events.
        eventBus.subscribe('collisionDetected', (e) => this.handleEntityCollision(e));
        eventBus.subscribe('worldBoundaryCollision', (e) => this.handleBoundaryCollision(e));
    }

    /**
     * Handles collisions with the edge of the world.
     * @param {object} event The collision event data.
     * @param {'world_bottom'} event.type The type of boundary.
     * @param {number} event.entityId The ID of the entity that hit the boundary.
     */
    handleBoundaryCollision({ type, entityId, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityId, PlayerControlledComponent);
        if (!isPlayer) return;

        if (type === 'world_bottom') {
            eventBus.publish('playerDied');
        }
    }

    /**
     * Translates a raw entity-object collision into a specific gameplay action.
     * @param {object} event The collision event data.
     * @param {number} event.entityA The ID of the player entity.
     * @param {object} event.entityB The raw level object that was collided with (e.g., fruit, spike).
     * @param {EntityManager} event.entityManager The entity manager instance.
     */
    handleEntityCollision({ entityA, entityB, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityA, PlayerControlledComponent);
        if (!isPlayer) return;

        // The logic is now based on the type property of the object collided with.
        switch (entityB.type) {
            case 'fruit':
                eventBus.publish('fruitCollected', entityB);
                break;
            case 'spike':
                eventBus.publish('playerTookDamage', { amount: 25 });
                break;
            case 'trophy':
                eventBus.publish('trophyCollision');
                break;
            case 'checkpoint':
                eventBus.publish('checkpointActivated', entityB);
                break;
        }
    }

    update(dt, context) {}
}