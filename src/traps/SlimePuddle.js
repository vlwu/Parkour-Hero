import { Trap } from './templates/Trap.js';

export class SlimePuddle extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 });
        this.type = 'slime_puddle';
        this.solid = false;

        this.lifespan = 3.0;
        this.isExpired = false;


        this.damageInterval = 1;
        this.damageTimer = 0;
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


        if (this.damageTimer > 0) {
            this.damageTimer -= dt;
        }
    }

    getRenderableData(assets, textures) {
        // This trap has no visuals
        return null;
    }

    onCollision(player, eventBus) {

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

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.lifespan = 3.0;
        this.isExpired = false;
        this.damageTimer = 0;
    }
}