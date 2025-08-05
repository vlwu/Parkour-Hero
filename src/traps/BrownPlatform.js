import { Trap } from './templates/Trap.js';

export class BrownPlatform extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 32, height: 10 });

        this.type = 'brown_platform';
        this.solid = true;
        this.oneway = true;
        this.isDynamic = true;

        this.anchorX = x;
        this.anchorY = y;
        this.platformX = x;
        this.platformY = y;
        this.prevX = x;
        this.prevY = y;

        this.distance = config.distance || 100;
        this.speed = config.speed || 50;
        this.period = this.distance > 0 && this.speed > 0 ? (this.distance / this.speed) * 2 : 0;
        this.timer = 0;

        this.state = 'idle';
        this.playerOn = false;

        this.animation = {
            frameCount: 8,
            frameSpeed: 0.1,
            frameTimer: 0,
            currentFrame: 0
        };
    }

    get hitbox() {
        return {
            x: this.platformX - this.width / 2,
            y: this.platformY - this.height / 2,
            width: this.width,
            height: this.height,
        };
    }

    getMovementDelta() {
        return { dx: this.platformX - this.prevX, dy: this.platformY - this.prevY };
    }


    update(dt, playerData, eventBus, level, groundEntity) {
        this.prevX = this.platformX;
        this.prevY = this.platformY;

        this.playerOn = (groundEntity === this);

        if (this.playerOn) {
            this.state = 'moving';
        }

        if (this.state === 'moving' && this.period > 0) {
            this.timer += dt;
            const progress = Math.sin((this.timer / this.period) * 2 * Math.PI);
            const offset = (progress * this.distance) / 2;
            this.platformX = this.anchorX + offset;

            if (this.playerOn) {
                this.animation.frameTimer += dt;
                if (this.animation.frameTimer >= this.animation.frameSpeed) {
                    this.animation.frameTimer = 0;
                    this.animation.currentFrame = (this.animation.currentFrame + 1) % this.animation.frameCount;
                }
            } else {
                 this.animation.currentFrame = 0;
            }
        }
    }

    getRenderableData(assets, textures) {
        const results = [];
        const chainTexture = textures.platform_chain;
        if (chainTexture) {
            const chainSpriteSize = 8;
            const halfDist = this.distance / 2;
            for (let i = -halfDist; i <= halfDist; i += chainSpriteSize) {
                const x = this.anchorX + i;
                const y = this.anchorY;
                const instanceData = [
                    x - chainSpriteSize / 2, y - chainSpriteSize / 2,
                    chainSpriteSize, chainSpriteSize, 0, 0, 8, 8, 0.0
                ];
                results.push({ texture: chainTexture, instanceData });
            }
        }

        const platformSpriteKey = this.playerOn ? 'platform_brown_on' : 'platform_brown_off';
        const platformSprite = assets[platformSpriteKey];
        const platformTexture = textures[platformSpriteKey];
        if (platformSprite && platformTexture) {
            const frameCount = this.playerOn ? this.animation.frameCount : 1;
            const frame = this.playerOn ? this.animation.currentFrame : 0;
            const frameWidth = platformSprite.width / frameCount;
            const srcX = frame * frameWidth;
            const instanceData = [
                this.platformX - this.width / 2, this.platformY - this.height / 2,
                this.width, this.height,
                srcX, 0,
                frameWidth, platformSprite.height,
                0.0
            ];
            results.push({ texture: platformTexture, instanceData });
        }
        return results;
    }

    reset() {
        this.state = 'idle';
        this.timer = 0;
        this.platformX = this.anchorX;
        this.platformY = this.anchorY;
        this.prevX = this.anchorX;
        this.prevY = this.anchorY;
        this.playerOn = false;
    }
}