import { Trap } from './templates/Trap.js';

export class SpikedBall extends Trap {
    /**
     * @param {number} x The anchor's world x-position (the pivot point).
     * @param {number} y The anchor's world y-position (the pivot point).
     * @param {object} config Configuration from the level file.
     */
    constructor(x, y, config) {
        // The ball itself is 28x28, so we pass that to the parent.
        super(x, y, { ...config, width: 28, height: 28 });

        // --- Configuration from level.json ---
        this.chainLength = config.chainLength || 100; 
        this.swingArc = config.swingArc || 90; 
        this.period = config.period || 4; 
        
        // --- Internal State ---
        this.anchorX = x;
        this.anchorY = y;
        this.ballX = this.anchorX;
        this.ballY = this.anchorY + this.chainLength;
        this.swingTimer = 0;
        this.maxAngle = (this.swingArc / 2) * (Math.PI / 180);
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
        this.ballX = this.anchorX + this.chainLength * Math.sin(currentAngle);
        this.ballY = this.anchorY + this.chainLength * Math.cos(currentAngle);
    }

    render(ctx, assets, camera) {
        if (!camera.isVisible(this.anchorX - this.chainLength, this.anchorY, this.chainLength * 2, this.chainLength * 2)) {
            return;
        }

        // --- MODIFICATION 2: Changed asset key to match what you added in asset-manager.js
        const ballSprite = assets.spiked_ball; 
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.anchorX, this.anchorY);
        ctx.lineTo(this.ballX, this.ballY);
        ctx.stroke();

        if (ballSprite) {
            ctx.drawImage(
                ballSprite,
                this.ballX - this.width / 2,
                this.ballY - this.height / 2,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.hitbox.x, this.hitbox.y, this.width, this.height);
        }
    }

    onCollision(player, eventBus) {
        eventBus.publish('collisionEvent', { 
            type: 'hazard', 
            entityId: player.entityId, 
            entityManager: player.entityManager, 
            damage: 50
        });
    }

    reset() {
        this.swingTimer = 0;
    }
}