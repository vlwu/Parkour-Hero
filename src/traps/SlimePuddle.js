import { Trap } from './templates/Trap.js';

export class SlimePuddle extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 });
        this.type = 'slime_puddle';
        this.solid = false;
        
        // This trap lives for 4 seconds, just like the visual particle.
        this.lifespan = 4.0; 
        this.isExpired = false;
        this.damageDealt = false; // Ensure it only deals damage once.
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
        this.lifespan -= dt;
        if (this.lifespan <= 0) {
            this.isExpired = true;
        }
    }

    // This trap is invisible, so the render method is empty.
    render(ctx, assets, camera) {
        // Intentionally left blank. This is an invisible damage zone.
    }

    onCollision(player, eventBus) {
        // Only deal damage if it hasn't already.
        if (this.damageDealt) return;

        this.damageDealt = true;
        
        eventBus.publish('collisionEvent', {
            type: 'hazard',
            entityId: player.entityId,
            entityManager: player.entityManager,
            damage: 5,
            knockback: null
        });

        // The puddle doesn't disappear on contact, it fades over time.
    }

    reset() {
        this.isExpired = true;
    }
}