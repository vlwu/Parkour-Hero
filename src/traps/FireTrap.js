import { Trap } from './templates/Trap.js';
import { TRAP_CONSTANTS } from '../utils/constants.js';

export class FireTrap extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 16, height: 16 });

        this.solid = true;
        this.state = 'off';
        this.frame = 0;
        this.frameTimer = 0;
        this.turnOffTimer = 0;
        this.damageTimer = TRAP_CONSTANTS.FIRE_TRAP_DAMAGE_INTERVAL;
        this.anim = {
            activating: { frames: 4, speed: 0.1 },
            on: { frames: 3, speed: 0.15 }
        };
    }

    _isPlayerOnTop(playerData) {
        if (!playerData) return false;
        
        const playerBottom = playerData.y + playerData.height;
        const platformTop = this.y - this.height / 2;

        return (
            playerData.x < this.x + this.width / 2 &&
            playerData.x + playerData.width > this.x - this.width / 2 &&
            Math.abs(playerBottom - platformTop) < 5 // Small tolerance
        );
    }

    get hitbox() {
        if (this.state === 'on' || this.state === 'activating') {
            return {
                x: this.x - this.width / 2,
                y: this.y - this.height * 1.5,
                width: this.width,
                height: this.height * 2
            };
        }
        return null;
    }

    update(dt, playerData, eventBus) {
        const playerIsCurrentlyOnTop = this._isPlayerOnTop(playerData);

        if (!playerIsCurrentlyOnTop && this.state === 'on') {
            this.state = 'turning_off';
            this.turnOffTimer = 2.0;
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

        if (this.state === 'on' && playerData) {
            const hazardHitbox = this.hitbox;
            const playerRect = { x: playerData.x, y: playerData.y, width: playerData.width, height: playerData.height };
            
            if (
                playerRect.x < hazardHitbox.x + hazardHitbox.width &&
                playerRect.x + playerRect.width > hazardHitbox.x &&
                playerRect.y < hazardHitbox.y + hazardHitbox.height &&
                playerRect.y + playerRect.height > hazardHitbox.y
            ) {
                this.damageTimer += dt;
                if (this.damageTimer >= TRAP_CONSTANTS.FIRE_TRAP_DAMAGE_INTERVAL) {
                    this.damageTimer -= TRAP_CONSTANTS.FIRE_TRAP_DAMAGE_INTERVAL;
                    eventBus.publish('playerTookDamage', { amount: TRAP_CONSTANTS.FIRE_TRAP_DAMAGE, source: 'fire' });
                }
            }
        } else {
             this.damageTimer = TRAP_CONSTANTS.FIRE_TRAP_DAMAGE_INTERVAL;
        }
    }

    render(ctx, assets, camera) {
        if (!camera.isVisible(this.x, this.y - this.height, this.width, this.height * 2)) return;

        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;

        const baseSprite = assets.fire_off;
        if (baseSprite) {
            ctx.drawImage(baseSprite, 0, 16, 16, 16, drawX, drawY, this.width, this.height);
        }

        if (this.state === 'off' || this.state === 'turning_off') return;

        let sprite, srcX = 0, frameWidth;
        if (this.state === 'activating') {
            sprite = assets.fire_hit;
            frameWidth = sprite.width / this.anim.activating.frames;
            srcX = this.frame * frameWidth;
        } else {
            sprite = assets.fire_on;
            frameWidth = sprite.width / this.anim.on.frames;
            srcX = this.frame * frameWidth;
        }

        if (sprite) {
            ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, drawX, drawY - this.height, this.width, this.height * 2);
        }
    }

    onLanded(eventBus) {
        if (this.state === 'off' || this.state === 'turning_off') {
            this.state = 'activating';
            this.frame = 0;
            this.frameTimer = 0;
            eventBus.publish('playSound', { key: 'fire_activated', volume: 0.8, channel: 'SFX' });
        }
    }

    reset() {
        this.state = 'off';
        this.frame = 0;
        this.frameTimer = 0;
        this.turnOffTimer = 0;
        this.damageTimer = TRAP_CONSTANTS.FIRE_TRAP_DAMAGE_INTERVAL;
    }
}