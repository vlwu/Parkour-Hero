import { Trap } from './templates/Trap.js';

export class SlimePuddle extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 });
        this.type = 'slime_puddle';
        this.solid = false;
        
        this.lifespan = 3.0; 
        this.isExpired = false;

        // Timer for periodic damage
        this.damageInterval = 1; 
        this.damageTimer = 0;      // Cooldown timer
    }

    get hitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height,
        };
    }

    update(dt) {
        // Countdown lifespan to expire the puddle
        this.lifespan -= dt;
        if (this.lifespan <= 0) {
            this.isExpired = true;
        }

        // Countdown damage cooldown timer
        if (this.damageTimer > 0) {
            this.damageTimer -= dt;
        }
    }

    // This trap is invisible, so the render method is empty.
    render(ctx, assets, camera) {
        // Intentionally left blank. This is an invisible damage zone.
    }

    onCollision(player, eventBus) {
        // If damage cooldown is over, deal damage and reset timer
        if (this.damageTimer <= 0) {
            this.damageTimer = this.damageInterval;
            
            eventBus.publish('collisionEvent', {
                type: 'hazard',
                entityId: player.entityId,
                entityManager: player.entityManager,
                damage: 5,
                knockback: null
            });
        }
    }

    reset() {
        this.isExpired = true;
    }
}