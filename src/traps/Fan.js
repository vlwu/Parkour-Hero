import { Trap } from './templates/Trap.js';

/**
 * A Fan trap that periodically turns on, pushing the player.
 */
export class Fan extends Trap {
    /**
     * @param {number} x The initial x-position in the game world.
     * @param {number} y The initial y-position in the game world.
     * @param {object} config The configuration object from the level data.
     */
    constructor(x, y, config) {
        super(x, y, config);
        this.width = 24;
        this.height = 8;
        this.type = 'fan';
        
        // Direction from level data ('right', 'left', 'up', 'down')
        this.direction = config.direction || 'right';
        // The force of the push. A bit less than player speed to allow moving against it.
        this.pushForce = 150; 
        
        // Internal state: 'on', 'off'
        this.state = 'off';
        this.onDuration = 5;
        this.offDuration = 5;
        this.timer = this.offDuration; // Start in the 'off' state

        this.onAnimation = {
            frameCount: 4,
            frameSpeed: 0.05,
            frameTimer: 0,
            currentFrame: 0,
        };
        
        this.particleTimer = 0;
    }

    /**
     * Updates the fan's state timer and animation.
     * @param {number} dt Delta time.
     * @param {object} playerData The player's position data.
     * @param {object} eventBus The global event bus.
     */
    update(dt, playerData, eventBus) {
        this.timer -= dt;

        if (this.timer <= 0) {
            if (this.state === 'off') {
                this.state = 'on';
                this.timer = this.onDuration;
                eventBus.publish('startSoundLoop', { key: 'fan_blowing', volume: 0.7, channel: 'SFX' });
            } else {
                this.state = 'off';
                this.timer = this.offDuration;
                eventBus.publish('stopSoundLoop', { key: 'fan_blowing' });
            }
        }

        if (this.state === 'on') {
            // Update animation
            this.onAnimation.frameTimer += dt;
            if (this.onAnimation.frameTimer >= this.onAnimation.frameSpeed) {
                this.onAnimation.frameTimer = 0;
                this.onAnimation.currentFrame = (this.onAnimation.currentFrame + 1) % this.onAnimation.frameCount;
            }

            // Create particles
            this.particleTimer += dt;
            if (this.particleTimer >= 0.05) {
                this.particleTimer = 0;
                eventBus.publish('createParticles', {
                    x: this.x,
                    y: this.y,
                    type: 'fan_push',
                    direction: this.direction
                });
            }
        }
    }

    /**
     * Renders the fan based on its state and direction.
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {object} assets The game's asset manager.
     * @param {Camera} camera The game camera.
     */
    render(ctx, assets, camera) {
        const sprite = this.state === 'on' ? assets.fan_on : assets.fan_off;
        if (!sprite) return;
        
        const frame = this.state === 'on' ? this.onAnimation.currentFrame : 0;
        const frameCount = this.state === 'on' ? this.onAnimation.frameCount : 1;
        
        // Use the base dimensions for rotation calculation
        const renderWidth = 24;
        const renderHeight = 8;
        
        const worldX = this.x - renderWidth / 2;
        const worldY = this.y - renderHeight / 2;
        const screenX = worldX - camera.x;
        const screenY = worldY - camera.y;

        const frameWidth = sprite.width / frameCount;
        const frameHeight = sprite.height;

        ctx.save();
        ctx.translate(screenX + renderWidth / 2, screenY + renderHeight / 2);

        let angle = 0;
        switch (this.direction) {
            case 'up': angle = -Math.PI / 2; break;
            case 'left': angle = Math.PI; break;
            case 'down': angle = Math.PI / 2; break;
            case 'right': default: angle = 0; break;
        }
        ctx.rotate(angle);

        ctx.drawImage(
            sprite,
            frame * frameWidth, 0,
            frameWidth, frameHeight,
            -renderWidth / 2, -renderHeight / 2,
            renderWidth, renderHeight
        );

        ctx.restore();
    }

    /**
     * Handles collision with the player, applying a continuous force.
     * @param {object} player A simplified object containing player data.
     */
    onCollision(player) {
        if (this.state !== 'on' || !player.dt) return;

        const { vel, dt } = player;
        let forceX = 0;
        let forceY = 0;

        switch (this.direction) {
            case 'up': forceY = -1; break;
            case 'down': forceY = 1; break;
            case 'left': forceX = -1; break;
            case 'right': forceX = 1; break;
        }

        vel.vx += forceX * this.pushForce * dt;
        vel.vy += forceY * this.pushForce * dt;
    }

    /**
     * Resets the fan to its initial state for a level restart.
     */
    reset(eventBus) {
        if (this.state === 'on') {
            eventBus.publish('stopSoundLoop', { key: 'fan_blowing' });
        }
        this.state = 'off';
        this.timer = this.offDuration;
        this.onAnimation.currentFrame = 0;
        this.onAnimation.frameTimer = 0;
    }
}