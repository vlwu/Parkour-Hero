import { Trap } from './templates/Trap.js';

export class FallingPlatform extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 32, height: 10 });

        this.solid = true;
        this.initialX = x;
        this.initialY = y;
        this.state = 'idle';

        this.playerOnTimer = 0;
        this.shakeTimer = 0;
        this.respawnTimer = 0;
        this.fallSpeed = 0;
        this.opacity = 1;

        this.bobbingTimer = Math.random() * Math.PI * 2;
        this.bobbingAmplitude = Math.random() * 5 + 5;

        this.PLAYER_ON_DURATION = 0.3;
        this.SHAKE_DURATION = 0.1;
        this.RESPAWN_DURATION = 5.0;
        this.FALL_ACCELERATION = 350;
        this.MAX_FALL_SPEED = 600;

        this.animation = {
            frameCount: 4,
            frameSpeed: 0.1,
            frameTimer: 0,
            currentFrame: 0,
        };
        this.particleTimer = 0;
    }

    _isPlayerOnTop(playerData) {
        if (!playerData) return false;
        const playerBottom = playerData.y + playerData.height;
        const platformTop = this.y - this.height / 2;

        return (
            playerData.x < this.x + this.width / 2 &&
            playerData.x + playerData.width > this.x - this.width / 2 &&
            Math.abs(playerBottom - platformTop) < 5
        );
    }

    update(dt, playerData, eventBus) {
        if (this.state === 'idle' || this.state === 'active') {
            this.animation.frameTimer += dt;
            if (this.animation.frameTimer >= this.animation.frameSpeed) {
                this.animation.frameTimer = 0;
                this.animation.currentFrame = (this.animation.currentFrame + 1) % this.animation.frameCount;
            }
        }

        switch (this.state) {
            case 'idle':
                this.bobbingTimer += dt * 2;
                this.y = this.initialY + Math.sin(this.bobbingTimer) * this.bobbingAmplitude;
                break;

            case 'active':
                this.playerOnTimer -= dt;

                if (!this._isPlayerOnTop(playerData)) {
                    this.reset();
                    return;
                }
                if (this.playerOnTimer <= 0) {
                    this.state = 'shaking';
                    this.shakeTimer = this.SHAKE_DURATION;
                    eventBus.publish('playSound', { key: 'falling_platform', volume: 0.7, channel: 'SFX' });
                }
                break;

            case 'shaking':
                this.shakeTimer -= dt;
                this.x = this.initialX + (Math.random() - 0.5) * 4;
                this.y = this.initialY + (Math.random() - 0.5) * 2;
                if (this.shakeTimer <= 0) {
                    this.state = 'falling';
                    this.solid = false;
                    this.x = this.initialX;
                    this.y = this.initialY;
                }
                break;

            case 'falling':
                this.fallSpeed = Math.min(this.MAX_FALL_SPEED, this.fallSpeed + this.FALL_ACCELERATION * dt);
                this.y += this.fallSpeed * dt;
                this.opacity -= dt * 0.5;

                this.particleTimer += dt;
                if (this.particleTimer > 0.05) {
                    this.particleTimer = 0;
                    eventBus.publish('createParticles', {
                        x: this.x,
                        y: this.y - this.height / 2,
                        type: 'walk_dust',
                        particleSpeed: 50
                    });
                }

                if (this.opacity <= 0) {
                    this.state = 'respawning';
                    this.respawnTimer = this.RESPAWN_DURATION;
                }
                break;

            case 'respawning':
                this.respawnTimer -= dt;
                if (this.respawnTimer <= 0) {
                    this.reset();
                }
                break;
        }
    }

    render(ctx, assets, camera) {
        if (this.state === 'respawning' || this.opacity <= 0) return;

        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;

        if (!camera.isVisible(drawX, drawY, this.width, this.height)) return;

        const isFanOn = this.state === 'idle' || this.state === 'active';
        const sprite = isFanOn ? assets.falling_platform_on : assets.falling_platform_off;

        if (!sprite) return;

        ctx.globalAlpha = this.opacity;

        if (isFanOn) {
            const frameWidth = sprite.width / this.animation.frameCount;
            const srcX = this.animation.currentFrame * frameWidth;
            ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, drawX, drawY, this.width, this.height);
        } else {
            ctx.drawImage(sprite, drawX, drawY, this.width, this.height);
        }

        ctx.globalAlpha = 1.0;
    }

    onLanded() {
        if (this.state === 'idle') {
            this.state = 'active';
            this.playerOnTimer = this.PLAYER_ON_DURATION;
        }
    }

    reset() {
        this.state = 'idle';
        this.x = this.initialX;
        this.y = this.initialY;
        this.opacity = 1;
        this.fallSpeed = 0;
        this.playerOnTimer = 0;
        this.solid = true;
        this.animation.currentFrame = 0;
        this.animation.frameTimer = 0;
    }
}