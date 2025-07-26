import { Trap } from './templates/Trap.js';
import { GRID_CONSTANTS, PLAYER_CONSTANTS } from '../utils/constants.js';

export class RockHead extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 42, height: 42 });

        this.initialY = y;
        this.targetY = y;
        this.type = 'rock_head';

        // State machine for the trap's behavior
        this.state = 'idle';
        this.timers = {
            blink: Math.random() * 4 + 2, // Blink every 2-6 seconds
            warning: 0.2, // How long it shakes before slamming
            slammed: 0.4, // How long the slam animation plays
        };
        this.velocities = {
            slam: 1200,
            retract: 80,
        };

        // Animation states
        this.animations = {
            blink: { frameCount: 4, frameSpeed: 0.08, timer: 0, frame: 0 },
            hit: { frameCount: 4, frameSpeed: 0.1, timer: 0, frame: 0 },
        };
        
        // Visual effect properties
        this.shakeOffset = { x: 0, y: 0 };
    }

    // The area below the trap that triggers the slam
    get detectionZone() {
        return {
            x: this.x - this.width / 2,
            y: this.y + this.height / 2,
            width: this.width,
            height: 500, // How far down it can "see" the player
        };
    }

    // The actual hitbox for killing the player
    get hitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height,
        };
    }

    isPlayerInZone(playerData, level) {
        if (!playerData) return false;

        const zone = this.detectionZone;
        const playerHitbox = { x: playerData.x, y: playerData.y, width: playerData.width, height: playerData.height };

        // Quick check: Is player horizontally aligned and generally below?
        if (playerHitbox.x + playerHitbox.width <= zone.x || playerHitbox.x >= zone.x + zone.width || playerHitbox.y < this.y) {
            return false;
        }

        // Determine the actual bottom of the detection zone by checking for solid tiles
        let detectionBottomY = this.y + this.height / 2 + zone.height;

        const startGridY = Math.floor((this.y + this.height / 2) / GRID_CONSTANTS.TILE_SIZE);
        const endGridY = Math.floor(detectionBottomY / GRID_CONSTANTS.TILE_SIZE);
        const startGridX = Math.floor(zone.x / GRID_CONSTANTS.TILE_SIZE);
        const endGridX = Math.floor((zone.x + zone.width) / GRID_CONSTANTS.TILE_SIZE);

        for (let y = startGridY; y <= endGridY; y++) {
            for (let x = startGridX; x <= endGridX; x++) {
                const tile = level.getTileAt(x * GRID_CONSTANTS.TILE_SIZE, y * GRID_CONSTANTS.TILE_SIZE);
                if (tile && tile.solid && !tile.oneWay) {
                    detectionBottomY = y * GRID_CONSTANTS.TILE_SIZE;
                    // Break both loops
                    y = endGridY + 1;
                    break;
                }
            }
        }
        
        // Now check if player is within the *actual* detection zone
        const actualZone = {
            x: zone.x,
            y: this.y + this.height / 2,
            width: zone.width,
            height: detectionBottomY - (this.y + this.height / 2),
        };

        return (
            playerHitbox.x < actualZone.x + actualZone.width &&
            playerHitbox.x + playerHitbox.width > actualZone.x &&
            playerHitbox.y < actualZone.y + actualZone.height &&
            playerHitbox.y + playerHitbox.height > actualZone.y
        );
    }

    update(dt, playerData, eventBus, level) {
        // Run state-specific logic
        this[`_update_${this.state}`]?.(dt, playerData, eventBus, level);
    }

    _update_idle(dt, playerData, eventBus, level) {
        this.timers.blink -= dt;
        if (this.timers.blink <= 0) {
            this.state = 'blinking';
            this.animations.blink.timer = 0;
            this.animations.blink.frame = 0;
            return;
        }

        if (this.isPlayerInZone(playerData, level)) {
            this.state = 'warning';
            this.timers.warning = 0.5;
        }
    }
    
    _update_blinking(dt) {
        this.animations.blink.timer += dt;
        if (this.animations.blink.timer >= this.animations.blink.frameSpeed) {
            this.animations.blink.timer = 0;
            this.animations.blink.frame++;
            if (this.animations.blink.frame >= this.animations.blink.frameCount) {
                this.state = 'idle';
                this.timers.blink = Math.random() * 3 + 2;
            }
        }
    }
    
    _update_warning(dt) {
        this.timers.warning -= dt;
        this.shakeOffset.x = (Math.random() - 0.5) * 6;
        this.shakeOffset.y = (Math.random() - 0.5) * 6;

        if (this.timers.warning <= 0) {
            this.state = 'slamming';
            this.shakeOffset = { x: 0, y: 0 };
        }
    }

    _update_slamming(dt, playerData, eventBus, level) {
        this.y += this.velocities.slam * dt;
        
        // Check for ground collision
        const groundTile = level.getTileAt(this.x, this.y + this.height / 2);
        if (groundTile.solid) {
            this.y = Math.floor((this.y + this.height / 2) / GRID_CONSTANTS.TILE_SIZE) * GRID_CONSTANTS.TILE_SIZE - this.height / 2;
            this.state = 'slammed';
            this.timers.slammed = 0.4;
            this.animations.hit.frame = 0;
            eventBus.publish('playSound', { key: 'rh_slam', volume: 1.5, channel: 'SFX' });
            eventBus.publish('cameraShakeRequested', { intensity: 15, duration: 0.3 });
            eventBus.publish('createParticles', { x: this.x, y: this.y + this.height / 2, type: 'walk_dust', particleSpeed: 200 });
            eventBus.publish('createParticles', { x: this.x, y: this.y + this.height / 2, type: 'sand', particleSpeed: 200 });
            return;
        }

        // Check for player collision
        if (playerData) {
            const playerHitbox = { x: playerData.x, y: playerData.y, width: playerData.width, height: playerData.height };
            if (this._isRectColliding(this.hitbox, playerHitbox)) {
                eventBus.publish('collisionEvent', {
                    type: 'hazard',
                    entityId: playerData.entityId, // playerData needs to carry entityId
                    entityManager: playerData.entityManager, // and entityManager
                    damage: 1000, // Instant kill damage
                    knockback: { vx: 0, vy: -100 }
                });
            }
        }
    }
    
    _update_slammed(dt) {
        this.timers.slammed -= dt;

        this.animations.hit.timer += dt;
        if (this.animations.hit.timer >= this.animations.hit.frameSpeed) {
            this.animations.hit.timer = 0;
            this.animations.hit.frame = Math.min(this.animations.hit.frame + 1, this.animations.hit.frameCount - 1);
        }

        if (this.timers.slammed <= 0) {
            this.state = 'retracting';
        }
    }
    
    _update_retracting(dt) {
        this.y -= this.velocities.retract * dt;
        if (this.y <= this.initialY) {
            this.y = this.initialY;
            this.state = 'idle';
            this.timers.blink = Math.random() * 3 + 2;
        }
    }

    render(ctx, assets, camera) {
        const drawX = this.x - this.width / 2 + this.shakeOffset.x;
        const drawY = this.y - this.height / 2 + this.shakeOffset.y;
        if (!camera.isVisible(drawX, drawY, this.width, this.height)) return;

        let sprite = assets.rh_idle;
        let sX = 0;
        let frameWidth = this.width;

        if (this.state === 'blinking') {
            sprite = assets.rh_blink;
            frameWidth = sprite.width / this.animations.blink.frameCount;
            sX = this.animations.blink.frame * frameWidth;
        } else if (this.state === 'slammed') {
            sprite = assets.rh_bottom_hit;
            frameWidth = sprite.width / this.animations.hit.frameCount;
            sX = this.animations.hit.frame * frameWidth;
        }
        
        if (sprite) {
            ctx.drawImage(sprite, sX, 0, frameWidth, sprite.height, drawX, drawY, this.width, this.height);
        }
    }
    
    // Helper for collision check during slam
    _isRectColliding(rectA, rectB) {
        return (
            rectA.x < rectB.x + rectB.width &&
            rectA.x + rectA.width > rectB.x &&
            rectA.y < rectB.y + rectB.height &&
            rectA.y + rectA.height > rectB.y
        );
    }

    reset() {
        this.y = this.initialY;
        this.state = 'idle';
        this.timers.blink = Math.random() * 3 + 2;
        this.shakeOffset = { x: 0, y: 0 };
        this.animations.blink.frame = 0;
        this.animations.hit.frame = 0;
    }
}