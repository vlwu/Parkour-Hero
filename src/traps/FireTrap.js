import { Trap } from './templates/Trap.js';

export class FireTrap extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 }); // Use config from level data
        
        // --- Logic migrated from level.js constructor ---
        this.solid = true; // The base is solid
        this.state = 'off'; // 'off', 'activating', 'on', 'turning_off'
        this.playerIsOnTop = false;
        this.frame = 0;
        this.frameTimer = 0;
        this.turnOffTimer = 0;
        this.damageTimer = 1.0; // Timer to apply damage periodically
        this.anim = {
            activating: { frames: 4, speed: 0.1 },
            on: { frames: 3, speed: 0.15 }
        };
    }

    update(dt, _playerPos, eventBus) {
        // --- Logic migrated from level.js updateFireTraps() ---
        if (!this.playerIsOnTop && this.state === 'on') {
            this.state = 'turning_off';
            this.turnOffTimer = 2.0; // Time before it turns off
        }

        switch (this.state) {
            case 'activating':
                this.frameTimer += dt;
                if (this.frameTimer >= this.anim.activating.speed) {
                    this.frameTimer = 0;
                    this.frame++;
                    if (this.frame >= this.anim.activating.frames) {
                        this.frame = 0;
                        this.state = 'on';
                    }
                }
                break;
            case 'on':
                this.frameTimer += dt;
                if (this.frameTimer >= this.anim.on.speed) {
                    this.frameTimer = 0;
                    this.frame = (this.frame + 1) % this.anim.on.frames;
                }
                break;
            case 'turning_off':
                this.turnOffTimer -= dt;
                if (this.turnOffTimer <= 0) {
                    this.state = 'off';
                    this.frame = 0;
                }
                break;
        }

        // --- Handle damage tick logic migrated from collision-system.js ---
        // We now handle the damage tick timer internally.
        if (this.state === 'on') {
            this.damageTimer += dt;
        } else if (!this.playerIsOnTop) {
            // Reset the damage timer when the player is not on top and the trap is not on
            this.damageTimer = 1.0;
        }
    }

    render(ctx, assets, camera) {
        // --- Logic migrated from renderer.js _drawFireTrapBases() & _drawFireTrapFlames() ---
        // Don't render if not visible
        if (!camera.isVisible(this.x, this.y - this.height, this.width, this.height * 2)) return;

        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;
        
        // 1. Draw the base
        const baseSprite = assets.fire_off;
        if (baseSprite) {
            ctx.drawImage(
                baseSprite, 0, 16, 16, 16, // Source rect (bottom half of the sprite)
                drawX, drawY, this.width, this.height // Destination rect
            );
        }

        // 2. Draw the flames if active
        if (this.state === 'off' || this.state === 'turning_off') return;

        let sprite, srcX = 0, frameWidth;
        if (this.state === 'activating') {
            sprite = assets.fire_hit;
            frameWidth = sprite.width / this.anim.activating.frames;
            srcX = this.frame * frameWidth;
        } else { // 'on' state
            sprite = assets.fire_on;
            frameWidth = sprite.width / this.anim.on.frames;
            srcX = this.frame * frameWidth;
        }

        if (sprite) {
            ctx.drawImage(
                sprite, srcX, 0, frameWidth, sprite.height, // Source frame
                drawX, drawY - this.height, // Draw flames above the base
                this.width, this.height * 2 // Destination rect
            );
        }
    }

    // This method will be called by the collision system
    // when the player lands on or touches the trap.
    onLanded(eventBus) {
        this.playerIsOnTop = true;
        if (this.state === 'off' || this.state === 'turning_off') {
            this.state = 'activating'; 
            this.frame = 0; 
            this.frameTimer = 0;
            eventBus.publish('playSound', { key: 'fire_activated', volume: 0.8, channel: 'SFX' });
        }
    }

    onCollision(player, eventBus) {
        // --- Logic migrated from collision-system.js ---
        if (this.state !== 'on') return;

        // Use the internal timer to decide when to deal damage.
        if (this.damageTimer >= 1.0) {
            this.damageTimer -= 1.0; // Reset timer for the next second
            eventBus.publish('playerTookDamage', { amount: 10, source: 'fire' });
        }
    }

    reset() {
        // --- Logic migrated from level.js reset() ---
        this.state = 'off';
        this.playerIsOnTop = false;
        this.frame = 0;
        this.frameTimer = 0;
        this.turnOffTimer = 0;
        this.damageTimer = 1.0;
    }
}