import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class GameplaySystem {
    constructor() {
        eventBus.subscribe('collisionDetected', (e) => this.handleEntityCollision(e));
        eventBus.subscribe('worldBoundaryCollision', (e) => this.handleBoundaryCollision(e));
    }

    handleBoundaryCollision({ type, entityId, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityId, PlayerControlledComponent);
        if (!isPlayer) return;

        if (type === 'world_bottom') {
            eventBus.publish('playerDied');
        }
    }

    handleEntityCollision({ entityA, entityB, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityA, PlayerControlledComponent);
        if (!isPlayer) return;

        // Check the type of entityB if it's not an entity ID (i.e., it's a raw level object)
        if (typeof entityB === 'object' && entityB.type) {
            switch (entityB.type) {
                case 'fruit':
                    eventBus.publish('fruitCollected', entityB);
                    break;
                case 'trophy':
                    eventBus.publish('trophyCollision');
                    break;
                case 'checkpoint':
                    eventBus.publish('checkpointActivated', entityB);
                    break;
            }
        }
    }

    update(dt, context) {}
}