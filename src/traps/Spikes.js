import { Trap } from './templates/Trap.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class Spikes extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 });


        this.state = 'hidden';
        this.activationRadius = 64;
        this.warningDuration = 0.4;
        this.retractDelay = 1.5;
        this.timer = 0;
        this.damage = config.damage || 40;
    }





    get hitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 4,
            width: this.width,
            height: this.height / 2,
        };
    }

    update(dt, playerPos) {

        if (!playerPos) return;

        if (this.timer > 0) {
            this.timer -= dt;
        }

        const playerLeft = playerPos.x;
        const playerRight = playerPos.x + playerPos.width;
        const playerTop = playerPos.y;
        const playerBottom = playerPos.y + playerPos.height;

        const activationLeft = this.x - this.activationRadius;
        const activationRight = this.x + this.activationRadius;
        const activationTop = this.y - this.activationRadius;
        const activationBottom = this.y + this.activationRadius;

        const playerInRange = playerRight > activationLeft && playerLeft < activationRight &&
                              playerBottom > activationTop && playerTop < activationBottom;

        switch (this.state) {
            case 'hidden':
                if (playerInRange) {
                    this.state = 'warning';
                    this.timer = this.warningDuration;
                }
                break;
            case 'warning':
                if (this.timer <= 0) {
                    this.state = 'extended';
                    this.timer = this.retractDelay;
                }
                break;
            case 'extended':
                if (this.timer <= 0) {
                    this.state = 'hidden';
                }
                break;
        }
    }

    render(ctx, assets, camera) {

        if (this.state === 'hidden' || this.state === 'warning') {
            return;
        }

        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;

        if (!camera.isVisible(drawX, drawY, this.width, this.height)) return;

        const sprite = assets.spike_two;
        if (sprite) {
            ctx.drawImage(sprite, drawX, drawY, this.width, this.height);
        }
    }

    onCollision(player, eventBus) {
        if (this.state !== 'extended') return;

        const renderable = player.entityManager.getComponent(player.entityId, RenderableComponent);
        if (!renderable) return;

        const knockbackVx = renderable.direction === 'right' ? -150 : 150;
        const knockbackVy = -200;

        eventBus.publish('collisionEvent', {
            type: 'hazard',
            entityId: player.entityId,
            entityManager: player.entityManager,
            damage: this.damage,
            knockback: {
                vx: knockbackVx,
                vy: knockbackVy,
            },
        });
    }

    reset() {

        this.state = 'hidden';
        this.timer = 0;
    }
}