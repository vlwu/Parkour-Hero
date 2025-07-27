import { Trap } from './templates/Trap.js';
import { TRAP_CONSTANTS } from '../utils/constants.js';

export class Saw extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 38, height: 38 });

        this.type = 'saw';
        this.anchorX = x;
        this.anchorY = y;
        this.sawX = x;
        this.sawY = y;
        
        this.direction = config.direction || 'horizontal'; // 'horizontal' or 'vertical'
        this.distance = config.distance || 100; // pixels
        this.speed = config.speed || 50; // pixels per second
        
        this.period = (this.distance / this.speed) * 2;
        this.timer = 0;

        this.animation = {
            frameCount: 8,
            frameSpeed: 0.05,
            frameTimer: 0,
            currentFrame: 0,
        };
    }

    get hitbox() {
        return {
            x: this.sawX - this.width / 2,
            y: this.sawY - this.height / 2,
            width: this.width,
            height: this.height,
        };
    }

    update(dt) {
        // Update animation
        this.animation.frameTimer += dt;
        if (this.animation.frameTimer >= this.animation.frameSpeed) {
            this.animation.frameTimer = 0;
            this.animation.currentFrame = (this.animation.currentFrame + 1) % this.animation.frameCount;
        }

        // Update position
        this.timer += dt;
        const progress = Math.sin((this.timer / this.period) * 2 * Math.PI);
        const offset = (progress * this.distance) / 2;

        if (this.direction === 'horizontal') {
            this.sawX = this.anchorX + offset;
            this.sawY = this.anchorY;
        } else { // vertical
            this.sawX = this.anchorX;
            this.sawY = this.anchorY + offset;
        }
    }

    getRenderableData(assets, textures) {
        const results = [];
        const chainTexture = textures.saw_chain;
        if (chainTexture) {
            // This is a simplified chain rendering. For perfect rendering, this would be more complex.
        }

        const sawSprite = assets.saw;
        const sawTexture = textures.saw;
        if (sawSprite && sawTexture) {
            const frameWidth = sawSprite.width / this.animation.frameCount;
            const srcX = this.animation.currentFrame * frameWidth;
            const instanceData = [
                this.sawX - this.width / 2, this.sawY - this.height / 2,
                this.width, this.height,
                srcX, 0,
                frameWidth, sawSprite.height,
                0.0
            ];
            results.push({ texture: sawTexture, instanceData });
        }
        return results;
    }

    onCollision(player, eventBus) {
        const playerCenterX = player.pos.x + player.col.width / 2;
        const playerCenterY = player.pos.y + player.col.height / 2;

        let dx = playerCenterX - this.sawX;
        let dy = playerCenterY - this.sawY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) {
            dx = 1; dy = 0;
        } else {
            dx /= distance; dy /= distance;
        }

        const knockbackStrength = TRAP_CONSTANTS.SAW_KNOCKBACK_BASE;

        eventBus.publish('collisionEvent', {
            type: 'hazard',
            entityId: player.entityId,
            entityManager: player.entityManager,
            damage: TRAP_CONSTANTS.SAW_DAMAGE,
            knockback: {
                vx: dx * knockbackStrength,
                vy: dy * knockbackStrength + TRAP_CONSTANTS.SAW_KNOCKBACK_Y_BOOST
            }
        });
    }

    reset() {
        this.timer = 0;
        this.sawX = this.anchorX;
        this.sawY = this.anchorY;
    }
}