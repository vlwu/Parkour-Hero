import { Trap } from './templates/Trap.js';

export class FallingPlatform extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 32, height: 10 });

        this.solid = true;
        this.initialX = x;
        this.initialY = y;
        this.state = 'idle'; // 'idle', 'shaking', 'falling', 'respawning'
        this.playerOnTimer = 0;
        this.shakeTimer = 0;
        this.respawnTimer = 0;
        this.fallSpeed = 0;
        this.opacity = 1;

        // Bobbing motion properties
        this.bobbingTimer = Math.random() * Math.PI * 2; // Start at a random point in the cycle
        this.bobbingAmplitude = Math.random() * 5 + 5; // 10-20 pixel total movement (5-10 amplitude)

        // Constants
        this.PLAYER_ON_DURATION = 0.5;
        this.SHAKE_DURATION = 0.3;
        this.RESPAWN_DURATION = 3.0;
        this.FALL_ACCELERATION = 250;
        this.MAX_FALL_SPEED = 400;

        // Animation
        this.animation = {
            frameCount: 4,
            frameSpeed: 0.1,
            frameTimer: 0,
            currentFrame: 0,
        };
        this.particleTimer = 0;
    }

    update(dt, playerData, eventBus) {
        // State-independent animation updates
        if (this.state === 'shaking' || this.state === 'falling') {
            this.animation.frameTimer += dt;
            if (this.animation.frameTimer >= this.animation.frameSpeed) {
                this.animation.frameTimer = 0;
                this.animation.currentFrame = (this.animation.currentFrame + 1) % this.animation.frameCount;
            }
        }

        // State machine
        switch (this.state) {
            case 'idle':
                this.bobbingTimer += dt * 2;
                this.y = this.initialY + Math.sin(this.bobbingTimer) * this.bobbingAmplitude;
                break;

            case 'shaking':
                this.shakeTimer -= dt;
                // Add a small random shake effect by slightly moving the original x position
                this.x = this.initialX + (Math.random() - 0.5) * 2;
                if (this.shakeTimer <= 0) {
                    this.state = 'falling';
                    this.x = this.initialX; // Reset x position before falling
                }
                break;

            case 'falling':
                this.fallSpeed = Math.min(this.MAX_FALL_SPEED, this.fallSpeed + this.FALL_ACCELERATION * dt);
                this.y += this.fallSpeed * dt;
                this.opacity -= dt * 0.5; // Fades out over 2 seconds

                // Dust particles
                this.particleTimer += dt;
                if (this.particleTimer > 0.05) {
                    this.particleTimer = 0;
                    eventBus.publish('createParticles', {
                        x: this.x,
                        y: this.y + this.height / 2, // Under the platform
                        type: 'walk_dust',
                        particleSpeed: 50
                    });
                }

                if (this.opacity <= 0) {
                    this.state = 'respawning';
                    this.respawnTimer = this.RESPAWN_DURATION;
                    this.solid = false; // Become non-solid while respawning
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

        const isAnimating = this.state === 'shaking' || this.state === 'falling';
        const sprite = isAnimating ? assets.falling_platform_on : assets.falling_platform_off;
        if (!sprite) return;

        ctx.globalAlpha = this.opacity;

        if (isAnimating) {
            const frameWidth = sprite.width / this.animation.frameCount;
            const srcX = this.animation.currentFrame * frameWidth;
            ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, drawX, drawY, this.width, this.height);
        } else {
            // idle state
            ctx.drawImage(sprite, drawX, drawY, this.width, this.height);
        }

        ctx.globalAlpha = 1.0;
    }

    onLanded() {
        if (this.state === 'idle') {
            this.state = 'shaking';
            this.shakeTimer = this.SHAKE_DURATION;
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
    }
}