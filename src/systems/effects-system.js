import { eventBus } from '../utils/event-bus.js';

export class EffectsSystem {
    constructor(assets) {
        this.assets = assets;
        this.activeEffects = [];
        eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
    }

    _onFruitCollected(fruit) {
        this.activeEffects.push({
            type: 'fruit_collected',
            x: fruit.x,
            y: fruit.y,
            size: fruit.size,
            frame: 0,
            frameCount: 6,
            frameSpeed: 0.1,
            frameTimer: 0
        });
    }

    reset() {
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
                }
            }
        }
    }

    // New method for the renderer to get active effects
    getActiveEffects() {
        return this.activeEffects;
    }
}