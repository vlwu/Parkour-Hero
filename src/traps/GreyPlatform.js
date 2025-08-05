import { Trap } from './templates/Trap.js';

export class GreyPlatform extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 32, height: 10 });

        this.type = 'grey_platform';
        this.solid = true;
        this.oneway = true;
        this.isDynamic = true;

        this.anchorX = x;
        this.anchorY = y;

        this.distance = config.distance || 100;
        this.speed = config.speed || 50;

        this.topY = this.anchorY - this.distance / 2;
        this.bottomY = this.anchorY + this.distance / 2;

        this.platformX = x;
        this.platformY = this.bottomY;
        this.prevX = x;
        this.prevY = this.bottomY;

        this.state = 'idle';
        this.playerOn = false;
        this.playerOffGracePeriod = 0.1;
        this.playerOffTimer = 0;

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
            y: this.platformY,
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

        const isPlayerCurrentlyOn = (groundEntity === this);

        if (isPlayerCurrentlyOn) {
            this.playerOn = true;
            this.playerOffTimer = this.playerOffGracePeriod;
        } else {
            this.playerOffTimer -= dt;
            if (this.playerOffTimer <= 0) {
                this.playerOn = false;
            }
        }

        switch (this.state) {
            case 'idle':
                if (this.playerOn) {
                    this.state = 'moving_up';
                }
                break;
            case 'moving_up':
                if (!this.playerOn) {
                    this.state = 'moving_down';
                } else {
                    this.platformY -= this.speed * dt;
                    if (this.platformY <= this.topY) {
                        this.platformY = this.topY;
                        this.state = 'at_top';
                    }
                }
                break;
            case 'at_top':
                if (!this.playerOn) {
                    this.state = 'moving_down';
                }
                break;
            case 'moving_down':
                this.platformY += this.speed * dt;
                if (this.platformY >= this.bottomY) {
                    this.platformY = this.bottomY;
                    this.state = 'idle';
                }
                break;
        }

        const shouldAnimate = this.state === 'moving_up' || this.state === 'moving_down' || (this.state === 'at_top' && this.playerOn);

        if (shouldAnimate) {
            this.animation.frameTimer += dt;
            if (this.animation.frameTimer >= this.animation.frameSpeed) {
                this.animation.frameTimer = 0;
                this.animation.currentFrame = (this.animation.currentFrame + 1) % this.animation.frameCount;
            }
        } else {
             this.animation.currentFrame = 0;
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

        const shouldAnimate = this.state === 'moving_up' || this.state === 'moving_down' || (this.state === 'at_top' && this.playerOn);
        const platformSpriteKey = shouldAnimate ? 'platform_grey_on' : 'platform_grey_off';
        const platformSprite = assets[platformSpriteKey];
        const platformTexture = textures[platformSpriteKey];
        if (platformSprite && platformTexture) {
            const frameCount = shouldAnimate ? this.animation.frameCount : 1;
            const frame = shouldAnimate ? this.animation.currentFrame : 0;
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
        this.platformX = this.anchorX;
        this.platformY = this.bottomY;
        this.prevX = this.anchorX;
        this.prevY = this.bottomY;
        this.playerOn = false;
        this.playerOffTimer = 0;
    }
}