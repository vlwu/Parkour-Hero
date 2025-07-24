import { Trap } from './templates/Trap.js';
import { TRAP_CONSTANTS } from '../utils/constants.js';

export class SpikedBall extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 28, height: 28 });

        this.chainLength = config.chainLength || 100;
        this.swingArc = config.swingArc || 90;
        this.period = config.period || 4;
        this.tiltAmount = config.tiltAmount || 0.5;

        this.anchorX = x;
        this.anchorY = y;
        this.ballX = this.anchorX;
        this.ballY = this.anchorY + this.chainLength;
        this.swingTimer = 0;
        this.maxAngle = (this.swingArc / 2) * (Math.PI / 180);
        this.rotation = 0;
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
        const angularVelocity = this.maxAngle * Math.cos((this.swingTimer / this.period) * 2 * Math.PI);

        this.rotation = angularVelocity * this.tiltAmount;
        this.ballX = this.anchorX + this.chainLength * Math.sin(currentAngle);
        this.ballY = this.anchorY + this.chainLength * Math.cos(currentAngle);
    }

    render(ctx, assets, camera) {
        if (!camera.isVisible(this.anchorX - this.chainLength, this.anchorY, this.chainLength * 2, this.chainLength * 2)) {
            return;
        }

        const ballSprite = assets.spiked_ball;
        const chainSprite = assets.spiked_ball_chain;

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

        if (ballSprite) {
            ctx.save();
            ctx.translate(this.ballX, this.ballY);
            ctx.rotate(this.rotation);
            ctx.drawImage(
                ballSprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
            ctx.restore();
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
        if (distance === 0) {
            dx = 1;
            dy = 0;
        } else {
            dx /= distance;
            dy /= distance;
        }

        const knockbackStrength = TRAP_CONSTANTS.SPIKED_BALL_KNOCKBACK_BASE;

        eventBus.publish('collisionEvent', {
            type: 'hazard',
            entityId: player.entityId,
            entityManager: player.entityManager,
            damage: TRAP_CONSTANTS.SPIKED_BALL_DAMAGE,
            knockback: {
                vx: dx * knockbackStrength,
                vy: dy * knockbackStrength + TRAP_CONSTANTS.SPIKED_BALL_KNOCKBACK_Y_BOOST
            }
        });
    }

    reset() {
        this.swingTimer = 0;
        this.rotation = 0;
    }
}