import { eventBus } from '../utils/event-bus.js';
import { BouncePlatformComponent } from '../components/BouncePlatformComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class InteractionSystem {
    constructor() {
    eventBus.subscribe('collisionDetected', (e) => this.handleCollision(e));
    }

    handleCollision({ entityA, entityB, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityA, PlayerControlledComponent);
        if (!isPlayer) return;

        const pPos = entityManager.getComponent(entityA, PositionComponent);
        const pVel = entityManager.getComponent(entityA, VelocityComponent);
        const pCol = entityManager.getComponent(entityA, CollisionComponent);
        const platformBounce = entityManager.getComponent(entityB, BouncePlatformComponent);
        const platformRenderable = entityManager.getComponent(entityB, RenderableComponent);
        const platformPos = entityManager.getComponent(entityB, PositionComponent);
        const platformCol = entityManager.getComponent(entityB, CollisionComponent);

        if (!pPos || !pVel || !pCol || !platformBounce || !platformRenderable || !platformPos || !platformCol) {
            return;
        }

        // MODIFICATION: Add a specific check to ensure the player is landing on TOP of the trampoline.
        const playerBottom = pPos.y + pCol.height;
        const platformTop = platformPos.y - platformCol.height / 2;
        const prevPlayerBottom = playerBottom - pVel.vy * (1/60); // Approximate previous frame position

        if (pVel.vy >= 0 && playerBottom >= platformTop && prevPlayerBottom <= platformTop + 1) {
            // FIX: Set the player's position firmly on top of the trampoline to prevent clipping through.
            pPos.y = platformTop - pCol.height;
            pVel.vy = -platformBounce.force;
            
            platformRenderable.animationState = 'jump';
            platformRenderable.animationFrame = 0;
            platformRenderable.animationTimer = 0;
            
            eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
        }
    }

    update(dt, context) {}
}