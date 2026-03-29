import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { TRAP_CONSTANTS } from '../utils/constants.js';

export class GameplaySystem {
    constructor() {
        this.collisionEvents = [];
        eventBus.subscribe('collisionEvent', (e) => this.collisionEvents.push(e));
    }

    handleCollision({ type, entityId, target, damage, knockback }, entityManager) {
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
                const hazardDamage = damage !== undefined ? damage : TRAP_CONSTANTS.DEFAULT_HAZARD_DAMAGE;

                if (hazardDamage > 0) {
                    eventBus.publish('playerTookDamage', { amount: hazardDamage, source: 'hazard' });
                }

                if (knockback) {
                    eventBus.publish('playerKnockback', {
                        entityId,
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

    update(_dt, { entityManager }) {
        for (const e of this.collisionEvents) {
            this.handleCollision(e, entityManager);
        }
        this.collisionEvents = [];
    }
}