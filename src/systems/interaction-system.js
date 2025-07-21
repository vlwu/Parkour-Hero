import { eventBus } from '../utils/event-bus.js';
import { BouncePlatformComponent } from '../components/BouncePlatformComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class InteractionSystem {
    constructor() {
        eventBus.subscribe('collisionDetected', (e) => this.handleCollision(e));
    }

    handleCollision({ entityA, entityB, entityManager }) {
        const isPlayer = !!entityManager.getComponent(entityA, PlayerControlledComponent);
        if (!isPlayer) return;

        const playerVel = entityManager.getComponent(entityA, VelocityComponent);
        const platformBounce = entityManager.getComponent(entityB, BouncePlatformComponent);
        const platformRenderable = entityManager.getComponent(entityB, RenderableComponent);

        if (playerVel && playerVel.vy > 0 && platformBounce && platformRenderable) {
            playerVel.vy = -platformBounce.force;
            
            // MODIFICATION: Set state to 'jump' to match asset and config names.
            platformRenderable.animationState = 'jump';
            platformRenderable.animationFrame = 0;
            platformRenderable.animationTimer = 0;
            
            eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
        }
    }

    update(dt, context) {}
}