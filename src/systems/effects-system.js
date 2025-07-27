import { eventBus } from '../utils/event-bus.js';

export class EffectsSystem {
    constructor(assets) {
        this.assets = assets;
        this.activeEffects = [];
        this.effectsPool = [];
        eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
    }

    _onFruitCollected(fruit) {
        let effect;
        if (this.effectsPool.length > 0) {
            effect = this.effectsPool.pop();
        } else {
            effect = {};
        }

        effect.type = 'fruit_collected';
        effect.x = fruit.x;
        effect.y = fruit.y;
        effect.size = fruit.size;
        effect.frame = 0;
        effect.frameCount = 6;
        effect.frameSpeed = 0.1;
        effect.frameTimer = 0;

        this.activeEffects.push(effect);
    }

    reset() {
        for (const effect of this.activeEffects) {
            this.effectsPool.push(effect);
        }
        this.activeEffects = [];
    }

    update(dt) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.frameTimer += dt;
            if (effect.frameTimer >= effect.frameSpeed) {
                effect.frameTimer = 0;
                effect.frame++;
                if (effect.frame >= effect.frameCount) {
                    this.activeEffects.splice(i, 1);
                    this.effectsPool.push(effect);
                }
            }
        }
    }

    render(ctx, camera, alpha) {
        if (this.activeEffects.length === 0) return;

        camera.apply(ctx, alpha);

        const sprite = this.assets['fruit_collected'];
        if (sprite) {
            const frameWidth = sprite.width / 6;
            for (const effect of this.activeEffects) {
                if (!camera.isRectVisible({ x: effect.x, y: effect.y, width: effect.size, height: effect.size })) continue;
                const srcX = effect.frame * frameWidth;
                ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, effect.x - effect.size / 2, effect.y - effect.size / 2, effect.size, effect.size);
            }
        }

        camera.restore(ctx);
    }
}