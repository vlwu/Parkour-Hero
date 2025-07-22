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
        
        // --- MODIFICATION START ---
        // Configurable properties for level design
        this.direction = config.direction || 'right';
        // The strength of the push. For 'up', it's a direct velocity. For others, a force.
        this.pushStrength = config.pushStrength || 250; 
        // The length of the wind column in pixels.
        this.windHeight = config.windHeight || 120;
        // How close the player needs to be for the sound to play.
        this.soundRadius = config.soundRadius || 250;
        // --- MODIFICATION END ---
        
        // Internal state: 'on', 'off'
        this.state = 'off';
        this.onDuration = 5;
        this.offDuration = 5;
        this.timer = this.offDuration; // Start in the 'off' state
        this.isSoundPlaying = false;

        this.onAnimation = {
            frameCount: 4,
            frameSpeed: 0.05,
            frameTimer: 0,
            currentFrame: 0,
        };
        
        this.particleTimer = 0;
    }

    /**
     * The hitbox represents the "column of wind", not the fan's physical body.
     * Its size and orientation are based on the fan's direction and power.
     */
    get hitbox() {
        const isVertical = this.direction === 'up' || this.direction === 'down';
        const bodyWidth = isVertical ? this.width : this.height;
        const bodyHeight = isVertical ? this.height : this.width;

        switch (this.direction) {
            case 'up':
                // Wind column starts from the fan's base and goes up.
                return {
                    x: this.x - bodyWidth / 2,
                    y: this.y - this.windHeight,
                    width: bodyWidth,
                    height: this.windHeight
                };
            case 'down':
                // Wind column starts from the fan's base and goes down.
                return {
                    x: this.x - bodyWidth / 2,
                    y: this.y,
                    width: bodyWidth,
                    height: this.windHeight
                };
            case 'left':
                // Wind column starts from the fan's base and goes left.
                return {
                    x: this.x - this.windHeight,
                    y: this.y - bodyHeight / 2,
                    width: this.windHeight,
                    height: bodyHeight
                };
            case 'right':
            default:
                // Wind column starts from the fan's base and goes right.
                return {
                    x: this.x,
                    y: this.y - bodyHeight / 2,
                    width: this.windHeight,
                    height: bodyHeight
                };
        }
    }

    /**
     * Updates the fan's state, animation, particles, and proximity-based sound.
     * @param {number} dt Delta time.
     * @param {object} playerData The player's position data.
     * @param {object} eventBus The global event bus.
     */
    update(dt, playerData, eventBus) {
        this.timer -= dt;

        // --- MODIFICATION: Sound logic is no longer handled in this block ---
        if (this.timer <= 0) {
            if (this.state === 'off') {
                this.state = 'on';
                this.timer = this.onDuration;
            } else {
                this.state = 'off';
                this.timer = this.offDuration;
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
                // --- MODIFICATION: Pass pushStrength to determine particle speed ---
                eventBus.publish('createParticles', {
                    x: this.x,
                    y: this.y,
                    type: 'fan_push',
                    direction: this.direction,
                    particleSpeed: this.pushStrength * 0.75 // Scale factor to look good
                });
            }
        }

        // --- MODIFICATION START: Proximity-based sound logic ---
        const wasSoundPlaying = this.isSoundPlaying;
        let shouldSoundBePlaying = false;

        // Sound should only play if the fan is on AND the player is nearby.
        if (this.state === 'on' && playerData) {
            const distance = Math.sqrt(Math.pow(playerData.x - this.x, 2) + Math.pow(playerData.y - this.y, 2));
            if (distance < this.soundRadius) {
                shouldSoundBePlaying = true;
            }
        }

        if (shouldSoundBePlaying && !wasSoundPlaying) {
            eventBus.publish('startSoundLoop', { key: 'fan_blowing', volume: 0.7, channel: 'SFX' });
            this.isSoundPlaying = true;
        } else if (!shouldSoundBePlaying && wasSoundPlaying) {
            eventBus.publish('stopSoundLoop', { key: 'fan_blowing' });
            this.isSoundPlaying = false;
        }
        // --- MODIFICATION END ---
    }

    /**
     * Renders the fan based on its state and direction.
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {object} assets The game's asset manager.
     * @param {Camera} camera The game camera.
     */
    render(ctx, assets, camera) {
        const sprite = this.state === 'on' ? assets.fan_on : assets.fan_off;
        // The actual fan body is small, so we check visibility against a slightly larger area
        // to ensure it doesn't pop in/out at screen edges.
        if (!sprite || !camera.isVisible(this.x - 32, this.y - 32, 64, 64)) {
            return;
        }
        
        const frame = this.state === 'on' ? this.onAnimation.currentFrame : 0;
        const frameCount = this.state === 'on' ? this.onAnimation.frameCount : 1;
        
        const renderWidth = 24;
        const renderHeight = 8;

        const frameWidth = sprite.width / frameCount;
        const frameHeight = sprite.height;

        ctx.save();
        ctx.translate(this.x, this.y);

        let angle = 0;
        switch (this.direction) {
            case 'up': angle = 0; break;
            case 'left': angle = -Math.PI / 2; break;
            case 'down': angle = Math.PI; break;
            case 'right': default: angle = Math.PI / 2; break;
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
     * Handles collision with the player, applying a continuous force or setting velocity.
     * @param {object} player A simplified object containing player data.
     */
    onCollision(player) {
        if (this.state !== 'on' || !player.dt) return;

        const { vel, dt } = player;

        // --- MODIFICATION: Use pushStrength and handle 'up' direction specially ---
        switch (this.direction) {
            case 'up':
                // Set velocity directly to override gravity and create a strong, consistent lift.
                vel.vy = -this.pushStrength;
                break;
            case 'down':
                // Apply as a continuous downward force.
                vel.vy += this.pushStrength * dt;
                break;
            case 'left':
                // Apply as a continuous horizontal force.
                vel.vx -= this.pushStrength * dt;
                break;
            case 'right':
                // Apply as a continuous horizontal force.
                vel.vx += this.pushStrength * dt;
                break;
        }
    }

    /**
     * Resets the fan to its initial state for a level restart.
     */
    reset(eventBus) {
        if (this.isSoundPlaying) {
            eventBus.publish('stopSoundLoop', { key: 'fan_blowing' });
        }
        this.state = 'off';
        this.timer = this.offDuration;
        this.isSoundPlaying = false;
        this.onAnimation.currentFrame = 0;
        this.onAnimation.frameTimer = 0;
    }
}