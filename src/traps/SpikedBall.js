import { Trap } from './templates/Trap.js';
import { TRAP_CONSTANTS } from '../utils/constants.js';

export class SpikedBall extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 28, height: 28 });

        this.isDynamic = true;
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
        this._hitbox.x = this.ballX - this.width / 2;
        this._hitbox.y = this.ballY - this.height / 2;
        this._hitbox.width = this.width;
        this._hitbox.height = this.height;
        return this._hitbox;
    }

    update(dt) {

        this.swingTimer += dt;
        const currentAngle = this.maxAngle * Math.sin((this.swingTimer / this.period) * 2 * Math.PI);
        const angularVelocity = this.maxAngle * Math.cos((this.swingTimer / this.period) * 2 * Math.PI);

        this.rotation = angularVelocity * this.tiltAmount;
        this.ballX = this.anchorX + this.chainLength * Math.sin(currentAngle);
        this.ballY = this.anchorY + this.chainLength * Math.cos(currentAngle);
    }

    getRenderableData(assets, textures) {
        const results = [];
        const chainTexture = textures.spiked_ball_chain;
        const ballTexture = textures.spiked_ball;

        if (chainTexture) {
            const chainSpriteSize = 8;
            const dx = this.ballX - this.anchorX;
            const dy = this.ballY - this.anchorY;
            const totalLength = Math.sqrt(dx * dx + dy * dy);
            const unitX = dx / totalLength;
            const unitY = dy / totalLength;

            for (let i = chainSpriteSize / 2; i < totalLength; i += chainSpriteSize) {
                const chainX = this.anchorX + i * unitX;
                const chainY = this.anchorY + i * unitY;
                const instanceData = [
                    chainX - chainSpriteSize / 2, chainY - chainSpriteSize / 2,
                    chainSpriteSize, chainSpriteSize, 0, 0, 8, 8, 0.0
                ];
                results.push({ texture: chainTexture, instanceData });
            }
        }

        if (ballTexture) {
            const instanceData = [
                this.ballX - this.width / 2, this.ballY - this.height / 2,
                this.width, this.height,
                0, 0,
                assets.spiked_ball.width, assets.spiked_ball.height,
                0.0
            ];
            results.push({ texture: ballTexture, instanceData, rotation: this.rotation });
        }
        return results;
    }

    onCollision(player, eventBus) {
        const playerCenterX = player.pos.x + player.col.width / 2;
        const playerCenterY = player.pos.y + player.col.height / 2;

        let dx = playerCenterX - this.ballX;
        let dy = playerCenterY - this.ballY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) {
            dx = 1; dy = 0;
        } else {
            dx /= distance; dy /= distance;
        }

        const knockbackStrength = TRAP_CONSTANTS.SPIKED_BALL_KNOCKBACK_BASE;

        eventBus.publish('collisionEvent', {
            type: 'hazard',
            entityId: player.entityId,
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