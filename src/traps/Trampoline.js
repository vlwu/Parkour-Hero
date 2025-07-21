import { Trap } from './templates/Trap.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class Trampoline extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 28, height: 28 }); // Trampolines are 28x28

        // --- Logic migrated from level.js constructor ---
        this.state = 'idle'; // 'idle' or 'jumping'
        this.frame = 0;
        this.frameCount = 8;
        this.frameSpeed = 0.05;
        this.frameTimer = 0;
    }

    update(dt) {
        // --- Logic migrated from level.js updateTrampolines() ---
        if (this.state === 'jumping') {
            this.frameTimer += dt;
            if (this.frameTimer >= this.frameSpeed) {
                this.frameTimer -= this.frameSpeed;
                this.frame++;
                if (this.frame >= this.frameCount) {
                    this.frame = 0;
                    this.state = 'idle';
                }
            }
        }
    }

    render(ctx, assets, camera) {
        // --- Logic migrated from renderer.js _drawTrampolines() ---
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;

        if (!camera.isVisible(drawX, drawY, this.width, this.height)) return;

        let sprite, srcX = 0, frameWidth;

        if (this.state === 'jumping') {
            sprite = assets.trampoline_jump;
            if (sprite) {
                frameWidth = sprite.width / this.frameCount;
                srcX = this.frame * frameWidth;
            }
        } else {
            sprite = assets.trampoline_idle;
            if (sprite) frameWidth = sprite.width;
        }

        if (sprite && frameWidth > 0) {
            ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, drawX, drawY, this.width, this.height);
        } else {
            // Fallback rendering
            ctx.fillStyle = '#8e44ad';
            ctx.fillRect(drawX, drawY, this.width, this.height);
        }
    }

    onCollision(player, eventBus) {
        // --- Logic migrated from collision-system.js _checkTrapInteractions() ---
        // This is a special interaction that directly affects player physics.
        const { pos, vel } = player;

        // The player is bounced upwards with a force multiplier.
        vel.vy = -PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER;
        
        // Correct player position to be exactly on top of the trampoline to prevent sinking in.
        pos.y = (this.y - this.height / 2) - pos.height;

        // Trigger animation and sound effects.
        this.state = 'jumping';
        this.frame = 0;
        this.frameTimer = 0;
        eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
    }

    reset() {
        // --- Logic migrated from level.js reset() ---
        this.state = 'idle';
        this.frame = 0;
        this.frameTimer = 0;
    }
}