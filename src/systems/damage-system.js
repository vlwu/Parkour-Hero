import { eventBus } from '../utils/event-bus.js';
import { DamageOnContactComponent } from '../components/DamageOnContactComponent.js';
import { PeriodicDamageComponent } from '../components/PeriodicDamageComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class DamageSystem {
    constructor() {
        // This system is primarily event-driven for instant damage.
        eventBus.subscribe('collisionDetected', (e) => this.handleCollision(e));
    }

    // Handles damage that occurs on a single, direct impact.
    handleCollision({ entityA, entityB, entityManager }) {
        // We assume entityA is the player and entityB is the trap/object.
        const isPlayer = !!entityManager.getComponent(entityA, PlayerControlledComponent);
        if (!isPlayer) return;

        const playerHealth = entityManager.getComponent(entityA, HealthComponent);
        const playerVel = entityManager.getComponent(entityA, VelocityComponent);
        const hazardDamage = entityManager.getComponent(entityB, DamageOnContactComponent);

        if (playerHealth && playerVel && hazardDamage) {
            eventBus.publish('playerTookDamage', { amount: hazardDamage.amount, source: hazardDamage.source });

            // Apply knockback if specified
            if (hazardDamage.knockbackForce > 0) {
                const angle = Math.atan2(playerVel.vy, playerVel.vx);
                playerVel.vx = -Math.cos(angle) * hazardDamage.knockbackForce;
                playerVel.vy = -Math.sin(angle) * hazardDamage.knockbackForce * 0.5; // Less vertical knockback
            }
        }
    }

    // Handles damage over time (e.g., standing in fire), which needs a per-frame update.
    update(dt, { entityManager, level }) {
        // Query for all entities that can deal periodic damage (like fire traps).
        // NOTE: This part of the system will be fully enabled in a later step when fire traps are
        // converted into entities with components. For now, the existing logic in CollisionSystem remains.
        const damagingHazards = entityManager.query([PeriodicDamageComponent, CollisionComponent]);
        const playerEntities = entityManager.query([PlayerControlledComponent, CollisionComponent, HealthComponent]);

        if (playerEntities.length === 0) return;
        const playerEntityId = playerEntities[0];

        // This is a placeholder for the future full implementation.
        // The logic would involve checking for overlaps between player and hazard hitboxes here.
    }
}