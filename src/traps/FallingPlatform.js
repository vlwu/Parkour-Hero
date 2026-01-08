import { Trap } from './templates/Trap.js';

export class FallingPlatform extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 32, height: 10 });

        this.solid = true;
        this.isDynamic = true;
        this.initialX = x;
        this.initialY = y;
        this.state = 'idle';

        this.playerOnTimer = 0;
        this.shakeTimer = 0;
        this.respawnTimer = 0;
        this.fallSpeed = 0;
        this.opacity = 1;

        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;

        this.bobbingTimer = Math.random() * Math.PI * 2;
        this.bobbingAmplitude = Math.random() * 5 + 5;

        this.PLAYER_ON_DURATION = 0.3;
        this.SHAKE_DURATION = 0.15;
        this.RESPAWN_DURATION = 5.0;
        this.FALL_ACCELERATION = 250;
        this.MAX_FALL_SPEED = 600;

        this.animation = {
            frameCount: 4,
            frameSpeed: 0.1,
            frameTimer: 0,
            currentFrame: 0,
        };
        this.particleTimer = 0;
        this.prevY = y;
    }

    get hitbox() { return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height }; }
    getMovementDelta() { return { dx: 0, dy: this.y - this.prevY }; }

    update(dt, playerData, eventBus) {

        this.prevY = this.y;

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
                if (this.playerOnTimer <= 0) {
                    this.state = 'shaking';
                    this.shakeTimer = this.SHAKE_DURATION;
                    eventBus.publish('playSound', { key: 'falling_platform', volume: 0.7, channel: 'SFX' });
                }
                break;

            case 'shaking':
                this.shakeTimer -= dt;
                this.shakeOffsetX = (Math.random() - 0.5) * 4;
                this.shakeOffsetY = (Math.random() - 0.5) * 2;
                if (this.shakeTimer <= 0) {
                    this.state = 'falling';
                    this.solid = false;
                    this.shakeOffsetX = 0;
                    this.shakeOffsetY = 0;
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
                    eventBus.publish('createRespawnTimer', {
                        x: this.initialX,
                        y: this.initialY,
                        duration: this.RESPAWN_DURATION
                    });
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

    getRenderableData(assets, textures) {
        if (this.state === 'respawning') return null;

        const isPlatformActive = this.state === 'idle' || this.state === 'active';
        const spriteKey = isPlatformActive ? 'falling_platform_on' : 'falling_platform_off';
        const sprite = assets[spriteKey];
        const texture = textures[spriteKey];
        if (!sprite || !texture) return null;

        const frameCount = isPlatformActive ? this.animation.frameCount : 1;
        const frame = isPlatformActive ? this.animation.currentFrame : 0;
        const frameWidth = sprite.width / frameCount;

        const instanceData = [
            (this.x - this.width / 2) + this.shakeOffsetX,
            (this.y - this.height / 2) + this.shakeOffsetY,
            this.width, this.height,
            frame * frameWidth, 0,
            frameWidth, sprite.height,
            0.0
        ];
        return { texture, instanceData, alpha: this.opacity };
    }

    onLanded() {
        if (this.state === 'idle') {
            this.state = 'active';
            this.playerOnTimer = this.PLAYER_ON_DURATION;
            this.y = this.initialY;
        }
    }

    reset() {
        this.state = 'idle';
        this.x = this.initialX;
        this.y = this.initialY;
        this.prevY = this.initialY;
        this.opacity = 1;
        this.fallSpeed = 0;
        this.playerOnTimer = 0;
        this.solid = true;
        this.animation.currentFrame = 0;
        this.animation.frameTimer = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }
}