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
        
        this.direction = config.direction || 'right';
        this.pushStrength = config.pushStrength || 250; 
        this.windHeight = config.windHeight || 120;
        this.soundRadius = config.soundRadius || 250;
        
        this.state = 'off';
        this.onDuration = 5;
        this.offDuration = 5;
        this.timer = this.offDuration;
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
     * The hitbox represents the "column of wind". Its size and orientation
     * are calculated based on the fan's direction and properties.
     */
    get hitbox() {
        // The fan's physical body dimensions.
        const bodyWidth = this.width;  // 24
        const bodyHeight = this.height; // 8

        // Correctly calculate hitbox for all directions
        switch (this.direction) {
            case 'up':
                // The wind column starts from the top edge of the fan's body and extends upwards.
                return {
                    x: this.x - bodyWidth / 2,
                    y: this.y - (bodyHeight / 2) - this.windHeight, 
                    width: bodyWidth,
                    height: this.windHeight
                };
            case 'down':
                // The wind column starts from the bottom edge of the fan's body and extends downwards.
                return {
                    x: this.x - bodyWidth / 2,
                    y: this.y + bodyHeight / 2,
                    width: bodyWidth,
                    height: this.windHeight
                };
            case 'left':
                // The fan is rotated. Its visual width is its bodyHeight, and its visual height is its bodyWidth.
                // The wind column starts from the left edge of the rotated body and extends leftwards.
                return {
                    x: this.x - (bodyHeight / 2) - this.windHeight,
                    y: this.y - bodyWidth / 2,
                    width: this.windHeight,
                    height: bodyWidth 
                };
            case 'right':
            default:
                // The wind column starts from the right edge of the rotated body and extends rightwards.
                return {
                    x: this.x + bodyHeight / 2,
                    y: this.y - bodyWidth / 2,
                    width: this.windHeight,
                    height: bodyWidth
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
            this.onAnimation.frameTimer += dt;
            if (this.onAnimation.frameTimer >= this.onAnimation.frameSpeed) {
                this.onAnimation.frameTimer = 0;
                this.onAnimation.currentFrame = (this.onAnimation.currentFrame + 1) % this.onAnimation.frameCount;
            }

            this.particleTimer += dt;
            if (this.particleTimer >= 0.05) {
                this.particleTimer = 0;
                eventBus.publish('createParticles', {
                    x: this.x,
                    y: this.y,
                    type: 'fan_push',
                    direction: this.direction,
                    particleSpeed: this.pushStrength * 0.75
                });
            }
        }

        const wasSoundPlaying = this.isSoundPlaying;
        let shouldSoundBePlaying = false;

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
    }

    /**
     * Renders the fan based on its state and direction.
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {object} assets The game's asset manager.
     * @param {Camera} camera The game camera.
     */
    render(ctx, assets, camera) {
        const sprite = this.state === 'on' ? assets.fan_on : assets.fan_off;
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
        if (this.state !== 'on') return;

        const { vel } = player;

        switch (this.direction) {
            case 'up':
                vel.vy = -this.pushStrength;
                break;
            case 'down':
                vel.vy = this.pushStrength;
                break;
            case 'left':
                vel.vx = -this.pushStrength;
                break;
            case 'right':
                vel.vx = this.pushStrength;
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