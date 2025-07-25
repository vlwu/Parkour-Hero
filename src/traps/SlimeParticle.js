import { Trap } from './templates/Trap.js';

export class SlimeParticle extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 });
        this.type = 'slime_particle';
        this.solid = false;
        
        this.lifespan = 3.0;
        this.isExpired = false;

        this.animation = {
            frameCount: 4,
            frameSpeed: 0.2,
            frameTimer: 0,
            currentFrame: Math.floor(Math.random() * 4),
        };
    }

    get hitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height,
        };
    }

    update(dt) {
        this.lifespan -= dt;
        if (this.lifespan <= 0) {
            this.isExpired = true;
        }

        this.animation.frameTimer += dt;
        if (this.animation.frameTimer >= this.animation.frameSpeed) {
            this.animation.frameTimer = 0;
            this.animation.currentFrame = (this.animation.currentFrame + 1) % this.animation.frameCount;
        }
    }

    render(ctx, assets, camera) {
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;

        if (this.isExpired || !camera.isVisible(drawX, drawY, this.width, this.height)) return;

        const sprite = assets.slime_particles;
        if (sprite) {
            ctx.globalAlpha = Math.min(1, this.lifespan / 1.5);
            const frameWidth = sprite.width / this.animation.frameCount;
            const srcX = this.animation.currentFrame * frameWidth;
            ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, drawX, drawY, this.width, this.height);
            ctx.globalAlpha = 1.0;
        }
    }

    onCollision(player, eventBus) {
        eventBus.publish('collisionEvent', {
            type: 'hazard',
            entityId: player.entityId,
            entityManager: player.entityManager,
            damage: 5,
            knockback: null
        });
        this.isExpired = true;
    }

    reset() {
        this.isExpired = true;
    }
}