import { Trap } from './templates/Trap.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { TRAP_CONSTANTS } from '../utils/constants.js';

export class Spikes extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 });

        this.state = 'hidden';
        this.activationRadius = 64;
        this.warningDuration = 0.4;
        this.retractDelay = 1.5;
        this.timer = 0;
        this.damage = config.damage || TRAP_CONSTANTS.SPIKE_DAMAGE;
        this.forceVisible = false; // For Virtual Guy
    }

    get hitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 4,
            width: this.width,
            height: this.height / 2,
        };
    }

    update(dt, playerPos, eventBus, level, groundEntity, playerCtrl) {
        if (!playerPos) return;

        // Check if player can see hidden traps
        this.forceVisible = playerCtrl && playerCtrl.detectTraps;

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

    getRenderableData(assets, textures) {
        if (!this.forceVisible && (this.state === 'hidden' || this.state === 'warning')) return null;

        const sprite = assets.spike_two;
        const texture = textures.spike_two;
        if (!sprite || !texture) return null;

        const instanceData = [
            this.x - this.width / 2, this.y - this.height / 2,
            this.width, this.height,
            0, 0,
            sprite.width, sprite.height,
            0.0
        ];
        
        let alpha = 1.0;

        return { texture, instanceData, alpha };
    }

    onCollision(player, eventBus) {
        if (this.state !== 'extended') return;

        const renderable = player.entityManager.getComponent(player.entityId, RenderableComponent);
        if (!renderable) return;

        const knockbackVx = renderable.direction === 'right' ? -TRAP_CONSTANTS.SPIKE_KNOCKBACK_X : TRAP_CONSTANTS.SPIKE_KNOCKBACK_X;
        const knockbackVy = TRAP_CONSTANTS.SPIKE_KNOCKBACK_Y;

        eventBus.publish('collisionEvent', {
            type: 'hazard',
            entityId: player.entityId,
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
        this.forceVisible = false;
    }
}