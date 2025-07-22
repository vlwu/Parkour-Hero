// Create new file: src/traps/SwingingBall.js

import { Trap } from './templates/Trap.js';

export class SwingingBall extends Trap {
    /**
     * @param {number} x The anchor's world x-position (the pivot point).
     * @param {number} y The anchor's world y-position (the pivot point).
     * @param {object} config Configuration from the level file.
     */
    constructor(x, y, config) {
        // The ball itself is 28x28, so we pass that to the parent.
        super(x, y, { ...config, width: 28, height: 28 });

        // --- Configuration from level.json ---
        // The length of the chain in pixels.
        this.chainLength = config.chainLength || 100; 
        // The total angle of the swing in degrees (e.g., 90 means 45 degrees to each side).
        this.swingArc = config.swingArc || 90; 
        // The time in seconds for one full back-and-forth swing.
        this.period = config.period || 4; 
        
        // --- Internal State ---
        // The anchor point is the x/y passed to the constructor.
        this.anchorX = x;
        this.anchorY = y;
        
        // The current position of the ball, updated each frame.
        this.ballX = this.anchorX;
        this.ballY = this.anchorY + this.chainLength;

        // A timer to drive the sine wave for swinging.
        this.swingTimer = 0;
        
        // Convert the swing arc to radians for Math functions.
        // We divide by 2 because the arc is the total travel, and we need the maximum angle from the center.
        this.maxAngle = (this.swingArc / 2) * (Math.PI / 180);
    }

    /**
     * The hitbox is dynamic, based on the ball's current position.
     * The CollisionSystem will use this getter automatically.
     */
    get hitbox() {
        return {
            x: this.ballX - this.width / 2,
            y: this.ballY - this.height / 2,
            width: this.width,
            height: this.height,
        };
    }

    /**
     * Update the trap's state every frame.
     * @param {number} dt Delta time.
     */
    update(dt) {
        this.swingTimer += dt;
        
        // Calculate the current angle of the swing using a sine wave.
        // This creates a smooth, oscillating motion.
        const currentAngle = this.maxAngle * Math.sin((this.swingTimer / this.period) * 2 * Math.PI);

        // Calculate the ball's new position based on the angle and chain length.
        this.ballX = this.anchorX + this.chainLength * Math.sin(currentAngle);
        this.ballY = this.anchorY + this.chainLength * Math.cos(currentAngle);
    }

    /**
     * Render the trap on the canvas.
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {object} assets The loaded game assets.
     * @param {Camera} camera The game camera for culling.
     */
    render(ctx, assets, camera) {
        // Don't render if the anchor and approximate swing area are off-screen.
        if (!camera.isVisible(this.anchorX - this.chainLength, this.anchorY, this.chainLength * 2, this.chainLength * 2)) {
            return;
        }

        const ballSprite = assets.trap_spiked_ball;
        // The chain sprite is not used, as drawing a line is more effective.
        
        // 1. Draw the chain as a simple line.
        ctx.strokeStyle = '#333'; // A dark color for the chain
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.anchorX, this.anchorY);
        ctx.lineTo(this.ballX, this.ballY);
        ctx.stroke();

        // 2. Draw the spiked ball sprite.
        if (ballSprite) {
            ctx.drawImage(
                ballSprite,
                this.ballX - this.width / 2,
                this.ballY - this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback rendering if the sprite is missing
            ctx.fillStyle = 'red';
            ctx.fillRect(this.hitbox.x, this.hitbox.y, this.width, this.height);
        }
    }

    /**
     * Called by the CollisionSystem when the player hits the trap.
     * @param {object} player Player data from the collision system.
     * @param {EventBus} eventBus The global event bus.
     */
    onCollision(player, eventBus) {
        // This is a standard hazard collision.
        eventBus.publish('collisionEvent', { 
            type: 'hazard', 
            entityId: player.entityId, 
            entityManager: player.entityManager, 
            damage: 50 // You can make this configurable in the level.json if you want
        });
    }

    /**
     * Reset the trap to its initial state when the level restarts.
     */
    reset() {
        this.swingTimer = 0;
    }
}