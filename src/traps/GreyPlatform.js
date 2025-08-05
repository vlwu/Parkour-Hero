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

    // DYNAMIC
    update(dt, playerData) {
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
            if (this.state === 'idle') {
                this.state = 'moving';
                const currentOffset = this.platformY - this.anchorY;
                const progressRatio = (currentOffset / (this.distance / 2));
                 if (Math.abs(progressRatio) <= 1) {
                    const angle = Math.asin(progressRatio);
                    this.timer = (angle / (2 * Math.PI)) * this.period;
                }
            }
        } else {
            this.state = 'idle';
        }

        if (this.state === 'moving' && this.period > 0) {
            this.timer += dt;
            const progress = Math.sin((this.timer / this.period) * 2 * Math.PI);
            const offset = (progress * this.distance) / 2;
            this.platformY = this.anchorY + offset;
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

        const platformSpriteKey = this.state === 'moving' ? 'platform_grey_on' : 'platform_grey_off';
        const platformSprite = assets[platformSpriteKey];
        const platformTexture = textures[platformSpriteKey];
        if (platformSprite && platformTexture) {
            const instanceData = [
                this.platformX - this.width / 2, this.platformY - this.height / 2,
                this.width, this.height,
                0, 0,
                platformSprite.width, platformSprite.height,
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