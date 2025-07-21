import { eventBus } from '../utils/event-bus.js';
import { DamageOnContactComponent } from '../components/DamageOnContactComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';

export class DamageSystem {
    constructor() {
        eventBus.subscribe('collisionDetected', (e) => this.handleCollision(e));
    }

    handleCollision({ entityA, entityB, entityManager }) {
        const aIsPlayer = entityManager.hasComponent(entityA, PlayerControlledComponent);
        const bIsPlayer = entityManager.hasComponent(entityB, PlayerControlledComponent);

        if (!aIsPlayer && !bIsPlayer) return;

        const playerId = aIsPlayer ? entityA : entityB;
        const hazardId = aIsPlayer ? entityB : entityA;

        const playerHealth = entityManager.getComponent(playerId, HealthComponent);
        const playerVel = entityManager.getComponent(playerId, VelocityComponent);
        const hazardDamage = entityManager.getComponent(hazardId, DamageOnContactComponent);

        if (playerHealth && playerVel && hazardDamage) {
            eventBus.publish('playerTookDamage', { amount: hazardDamage.amount, source: hazardDamage.source });

            if (hazardDamage.knockbackForce > 0) {
                // A simple knockback: push the player up and away from the hazard
                const pPos = entityManager.getComponent(playerId, 'PositionComponent');
                const hPos = entityManager.getComponent(hazardId, 'PositionComponent');
                
                if (pPos && hPos) {
                    const angle = Math.atan2(pPos.y - hPos.y, pPos.x - hPos.x);
                    playerVel.vx = Math.cos(angle) * hazardDamage.knockbackForce;
                    playerVel.vy = Math.sin(angle) * hazardDamage.knockbackForce - 150; // Add some upward force
                }
            }
        }
    }

    update(dt, { entityManager }) {}
}