import { RenderableComponent } from '../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class AnimationSystem {
    update(dt, { entityManager }) {
        const entities = entityManager.query([RenderableComponent]);

        for (const entityId of entities) {
            if (entityManager.hasComponent(entityId, PlayerControlledComponent)) {
                continue;
            }

            const renderable = entityManager.getComponent(entityId, RenderableComponent);
            if (!renderable.animationConfig || !renderable.animationConfig[renderable.animationState]) {
                continue;
            }

            const config = renderable.animationConfig[renderable.animationState];
            renderable.animationTimer += dt;

            if (renderable.animationTimer >= config.speed) {
                renderable.animationTimer -= config.speed;

                const isAnimationFinished = !config.loop && renderable.animationFrame === config.frames - 1;

                // Only increment the frame if the animation isn't finished.
                if (!isAnimationFinished) {
                    renderable.animationFrame++;
                }

                if (renderable.animationFrame >= config.frames) {
                    if (config.loop) {
                        renderable.animationFrame = 0;
                    } else {
                        // This block is now reached only once when the animation completes.
                        renderable.animationFrame = config.frames - 1;
                        if (renderable.animationState === 'jump') {
                            renderable.animationState = 'idle';
                        }
                    }
                }
            }
        }
    }
}