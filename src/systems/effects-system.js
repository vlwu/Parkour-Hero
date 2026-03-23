import { eventBus } from '../utils/event-bus.js';

export class EffectsSystem {
    constructor(assets, fontRenderer) {
        this.assets = assets;
        this.fontRenderer = fontRenderer;
        this.activeEffects = [];
        this.effectsPool = [];
        this.damageIndicators = [];
        this.indicatorPool = [];
        this.respawnTimers = []; 
        eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
        eventBus.subscribe('createDamageIndicator', (data) => this._onDamageTaken(data));
        eventBus.subscribe('createRespawnTimer', (data) => this._onRespawnTimer(data));
        eventBus.subscribe('resetEffects', () => this.reset());
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

    _onDamageTaken({ amount, x, y }) {
        let indicator;
        if (this.indicatorPool.length > 0) {
            indicator = this.indicatorPool.pop();
        } else {
            indicator = {};
        }

        indicator.text = `-${Math.round(amount)}`;
        indicator.x = x;
        indicator.y = y;
        indicator.life = 0.4;
        indicator.maxLife = 0.4;
        indicator.alpha = 1.0;
        indicator.driftSpeed = -50;

        this.damageIndicators.push(indicator);
    }

    _onRespawnTimer({ x, y, duration }) {
        this.respawnTimers.push({
            x,
            y,
            life: duration,
            initialDuration: duration
        });
    }

    reset() {
        for (const effect of this.activeEffects) {
            this.effectsPool.push(effect);
        }
        this.activeEffects = [];
        for (const indicator of this.damageIndicators) {
            this.indicatorPool.push(indicator);
        }
        this.damageIndicators = [];
        this.respawnTimers = [];
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

        for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
            const indicator = this.damageIndicators[i];
            indicator.life -= dt;

            if (indicator.life <= 0) {
                this.indicatorPool.push(this.damageIndicators.splice(i, 1));
            } else {
                indicator.y += indicator.driftSpeed * dt;
                indicator.alpha = Math.min(1.0, (indicator.life / indicator.maxLife) * 2);
            }
        }

        for (let i = this.respawnTimers.length - 1; i >= 0; i--) {
            const timer = this.respawnTimers[i];
            timer.life -= dt;
            if (timer.life <= 0) {
                this.respawnTimers.splice(i, 1);
            }
        }
    }

    render(ctx, camera, alpha) {
        if (this.activeEffects.length === 0 && this.damageIndicators.length === 0 && this.respawnTimers.length === 0) return;

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

        if (this.fontRenderer) {
            if (this.damageIndicators.length > 0) {
                this.damageIndicators.forEach(indicator => {
                    const color = `rgba(255, 0, 0, ${indicator.alpha})`;
                    const outlineColor = `rgba(0, 0, 0, ${indicator.alpha})`;

                    this.fontRenderer.drawText(ctx, indicator.text, indicator.x, indicator.y, {
                        scale: 1.5,
                        align: 'center',
                        color: color,
                        outlineColor: outlineColor,
                        outlineWidth: 1
                    });
                });
            }

            if (this.respawnTimers.length > 0) {
                this.respawnTimers.forEach(timer => {
                    if (timer.life > 0) {
                        const timeLeft = Math.ceil(timer.life);
                        const fraction = timer.life - Math.floor(timer.life);
                        const opacity = Math.sin(fraction * Math.PI);

                        ctx.save();
                        ctx.globalAlpha = opacity;

                        this.fontRenderer.drawText(ctx, timeLeft.toString(), timer.x, timer.y - 10, {
                            scale: 1.5,
                            align: 'center',
                            color: 'white',
                            outlineColor: 'black',
                            outlineWidth: 1
                        });
                        
                        ctx.restore();
                    }
                });
            }
        }

        camera.restore(ctx);
    }
}