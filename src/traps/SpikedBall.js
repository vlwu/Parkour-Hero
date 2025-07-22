import { Trap } from './templates/Trap.js';

export class SpikedBall extends Trap {
    /**
     * @param {number} x The anchor's world x-position (the pivot point).
     * @param {number} y The anchor's world y-position (the pivot point).
     * @param {object} config Configuration from the level file.
     */
    constructor(x, y, config) {
        super(x, y, { ...config, width: 28, height: 28 });

        this.chainLength = config.chainLength || 100; 
        this.swingArc = config.swingArc || 90; 
        this.period = config.period || 4; 
        this.tiltAmount = config.tiltAmount || 0.5; // New property to control how much the ball tilts. Can be set in the level JSON.
        
        this.anchorX = x;
        this.anchorY = y;
        this.ballX = this.anchorX;
        this.ballY = this.anchorY + this.chainLength;
        this.swingTimer = 0;
        this.maxAngle = (this.swingArc / 2) * (Math.PI / 180);

        // --- MODIFICATION START ---
        // Internal state for the current rotation/tilt of the ball.
        this.rotation = 0;
        // --- MODIFICATION END ---
    }

    get hitbox() {
        return {
            x: this.ballX - this.width / 2,
            y: this.ballY - this.height / 2,
            width: this.width,
            height: this.height,
        };
    }

    update(dt) {
        this.swingTimer += dt;
        const currentAngle = this.maxAngle * Math.sin((this.swingTimer / this.period) * 2 * Math.PI);
        
        // --- MODIFICATION START ---
        // Calculate the angular velocity of the swing (how fast it's swinging).
        // The derivative of sin(t) is cos(t), which represents the rate of change.
        const angularVelocity = this.maxAngle * Math.cos((this.swingTimer / this.period) * 2 * Math.PI);
        // Set the ball's rotation based on the velocity and the configurable tilt amount.
        this.rotation = angularVelocity * this.tiltAmount;
        // --- MODIFICATION END ---
        
        this.ballX = this.anchorX + this.chainLength * Math.sin(currentAngle);
        this.ballY = this.anchorY + this.chainLength * Math.cos(currentAngle);
    }

    render(ctx, assets, camera) {
        if (!camera.isVisible(this.anchorX - this.chainLength, this.anchorY, this.chainLength * 2, this.chainLength * 2)) {
            return;
        }

        const ballSprite = assets.spiked_ball;
        const chainSprite = assets.spiked_ball_chain;

        // 1. Draw the chain using the sprite.
        if (chainSprite) {
            const chainSpriteSize = 8;
            const dx = this.ballX - this.anchorX;
            const dy = this.ballY - this.anchorY;
            const totalLength = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            ctx.save();
            ctx.translate(this.anchorX, this.anchorY);
            ctx.rotate(angle);
            
            for (let i = 0; i < totalLength; i += chainSpriteSize) {
                ctx.drawImage(chainSprite, i, -chainSpriteSize / 2, chainSpriteSize, chainSpriteSize);
            }
            ctx.restore();
        }

        // 2. Draw the spiked ball sprite with rotation.
        if (ballSprite) {
            // --- MODIFICATION START ---
            ctx.save(); // Save the canvas state
            
            // Move the canvas origin to the center of the ball
            ctx.translate(this.ballX, this.ballY);
            
            // Apply the calculated rotation
            ctx.rotate(this.rotation);
            
            // Draw the sprite centered on the new, rotated origin
            ctx.drawImage(
                ballSprite,
                -this.width / 2,  // Draw at negative half-width
                -this.height / 2, // Draw at negative half-height
                this.width,
                this.height
            );

            ctx.restore(); // Restore the canvas to its pre-rotated state
            // --- MODIFICATION END ---
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.hitbox.x, this.hitbox.y, this.width, this.height);
        }
    }

    onCollision(player, eventBus) {
        const playerCenterX = player.pos.x + player.col.width / 2;
        const playerCenterY = player.pos.y + player.col.height / 2;

        let dx = playerCenterX - this.ballX;
        let dy = playerCenterY - this.ballY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) { // Avoid division by zero if player is perfectly centered
            dx = 1;
            dy = 0;
        } else {
            dx /= distance;
            dy /= distance;
        }

        const knockbackStrength = 200; // A force impulse in pixels/second

        eventBus.publish('collisionEvent', { 
            type: 'hazard', 
            entityId: player.entityId, 
            entityManager: player.entityManager, 
            damage: 50,
            knockback: {
                vx: dx * knockbackStrength,
                vy: dy * knockbackStrength - 150 // Add a slight upward force to prevent slamming into ground
            }
        });
    }

    reset() {
        this.swingTimer = 0;
        this.rotation = 0;
    }
}