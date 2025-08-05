import { Trap } from './templates/Trap.js';

export class GreyPlatform extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 32, height: 10 });

        this.type = 'grey_platform';
        this.solid = true;
        this.oneway = true;

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


    update(dt, playerData) { // DYNAMIC
        this.prevX = this.platformX;
        this.prevY = this.platformY;

        this.playerOn = false;
        if (playerData) {
            const playerBottom = playerData.y + playerData.height;
            const platformTop = this.hitbox.y;
            if (
                playerData.x < this.hitbox.x + this.hitbox.width &&
                playerData.x + playerData.width > this.hitbox.x &&
                Math.abs(playerBottom - platformTop) < 5
            ) {
                this.playerOn = true;
            }
        }

        if (this.playerOn) {
            this.state = 'moving';
        } else if (this.state === 'moving') {
             this.timer += dt;
             if (this.timer >= this.period) {
                this.timer = 0;
                this.state = 'idle';
             }
        }

        if (this.state === 'moving' && this.period > 0) {
            this.timer += dt;
            const progress = Math.sin((this.timer / this.period) * 2 * Math.PI);
            const offset = (progress * this.distance) / 2;
            this.platformY = this.anchorY + offset;

            this.animation.frameTimer += dt;
            if (this.animation.frameTimer >= this.animation.frameSpeed) {
                this.animation.frameTimer = 0;
                this.animation.currentFrame = (this.animation.currentFrame + 1) % this.animation.frameCount;
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
                const x = this.anchorX;
                const y = this.anchorY + i;
                const instanceData = [
                    x - chainSpriteSize / 2, y - chainSpriteSize / 2,
                    chainSpriteSize, chainSpriteSize, 0, 0, 8, 8, 0.0
                ];
                results.push({ texture: chainTexture, instanceData });
            }
        }

        const platformSpriteKey = this.playerOn ? 'platform_grey_on' : 'platform_grey_off';
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

    onLanded() {
        this.playerOn = true;
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