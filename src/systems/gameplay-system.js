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
    handleCollision({ type, entityId, target, entityManager, damage, knockback }) {
        const isPlayer = !!entityManager.getComponent(entityId, PlayerControlledComponent);
        if (!isPlayer) return;

        switch (type) {
            case 'fruit':
                eventBus.publish('fruitCollected', target);
                break;
            case 'world_bottom':
                eventBus.publish('playerDied');
                break;
            case 'hazard':
                const hazardDamage = damage !== undefined ? damage : 25;
                // Only trigger the damage event if there is actual damage.
                // This prevents the hit animation and stun for non-damaging hazards like the ArrowBubble.
                if (hazardDamage > 0) {
                    eventBus.publish('playerTookDamage', { amount: hazardDamage, source: 'hazard' });
                }

                if (knockback) {
                    eventBus.publish('playerKnockback', {
                        entityId,
                        entityManager,
                        vx: knockback.vx,
                        vy: knockback.vy
                    });
                }
                break;
            case 'checkpoint':
                eventBus.publish('checkpointActivated', target);
                break;
        }
    }

    update(dt, context) {}
}