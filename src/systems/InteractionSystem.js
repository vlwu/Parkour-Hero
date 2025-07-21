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
        const platformRenderable = entityManager.getComponent(entityB, RenderableComponent); // For animation

        // Check if the player is moving downwards when hitting the bouncer
        if (playerVel && playerVel.vy > 0 && platformBounce) {
            playerVel.vy = -platformBounce.force;

            // Trigger animations or sounds
            if (platformRenderable) {
                // Future enhancement: create an AnimationStateComponent to manage this
                // platformRenderable.animationState = 'jump';
            }
            eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
        }
    }

    update(dt, context) {
        // This system is currently event-driven and does not require a per-frame update.
    }
}