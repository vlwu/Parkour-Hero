import { Trap } from './templates/Trap.js';

export class Spikes extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 }); // Spikes are 16x16

        // --- Logic migrated from level.js constructor ---
        this.state = 'hidden'; // 'hidden', 'warning', 'extended'
        this.activationRadius = 64;
        this.warningDuration = 0.4;
        this.retractDelay = 1.5;
        this.timer = 0;
        this.damage = config.damage || 40; // Allow damage to be set in level data
    }

    /**
     * The hitbox for spikes is smaller than the full tile, representing just the pointy end.
     * We use a getter to calculate it on the fly.
     */
    get hitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 4,
            width: this.width,
            height: this.height / 2,
        };
    }

    update(dt, playerPos) {
        // --- Logic migrated from level.js updateSpikes() ---
        if (!playerPos) return;

        if (this.timer > 0) {
            this.timer -= dt;
        }

        const playerLeft = playerPos.x;
        const playerRight = playerPos.x + playerPos.width; // Assume playerPos has width/height
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
        // --- Logic migrated from renderer.js _drawSpikes() ---
        if (this.state === 'hidden' || this.state === 'warning') {
            return; // Don't draw if not extended
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
        // --- Logic migrated from collision-system.js _checkTrapInteractions() ---
        if (this.state !== 'extended') return;
        
        // The collision system will have already checked for intersection with the hitbox.
        // We just need to publish the event.
        eventBus.publish('collisionEvent', { 
            type: 'hazard', 
            entityId: player.entityId, 
            entityManager: player.entityManager, 
            damage: this.damage 
        });
    }

    reset() {
        // --- Logic migrated from level.js reset() ---
        this.state = 'hidden';
        this.timer = 0;
    }
}