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

    get damageHitbox() {
        if (this.state === 'on' || this.state === 'activating') {
            if (!this._damageHitbox) this._damageHitbox = { x: 0, y: 0, width: 0, height: 0 };
            this._damageHitbox.x = this.x - this.width / 2;
            this._damageHitbox.y = this.y - this.height * 1.5;
            this._damageHitbox.width = this.width;
            this._damageHitbox.height = this.height * 2;
            return this._damageHitbox;
        }
        return null;
    }

    update(dt, playerData, eventBus) {
        let playerIsCurrentlyOnTop = false;
        if (playerData) {
            const playerBottom = playerData.y + playerData.height;
            const platformTop = this.y - this.height / 2;
            playerIsCurrentlyOnTop = (
                playerData.x < this.x + this.width / 2 &&
                playerData.x + playerData.width > this.x - this.width / 2 &&
                Math.abs(playerBottom - platformTop) < 5
            );
        }

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
            case 'turning_off':
                this.frameTimer += dt;
                if (this.frameTimer >= this.anim.on.speed) {
                    this.frameTimer = 0;
                    this.frame = (this.frame + 1) % this.anim.on.frames;
                }
                if (this.state === 'turning_off') {
                    this.turnOffTimer -= dt;
                    if (this.turnOffTimer <= 0) {
                        this.state = 'off';
                        this.frame = 0;
                    }
                }
                break;
        }

        if (this.state === 'on' && playerData) {
            const hazardHitbox = this.damageHitbox;

            if (
                hazardHitbox &&
                playerData.x < hazardHitbox.x + hazardHitbox.width &&
                playerData.x + playerData.width > hazardHitbox.x &&
                playerData.y < hazardHitbox.y + hazardHitbox.height &&
                playerData.y + playerData.height > hazardHitbox.y
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

    getRenderableData(assets, textures) {
        const results = [];
        const startX = this.x - this.width / 2;
        const startY = this.y - this.height / 2;

        const baseSprite = assets.fire_off;
        const baseTexture = textures.fire_off;

        if (baseSprite && baseTexture) {
            const instanceData = [
                startX, startY,
                this.width, this.height,
                0, 16, 16, 16, 0.0
            ];
            results.push({ texture: baseTexture, instanceData });
        }

        if (this.state === 'off') return results;

        let sprite, texture, srcX = 0, frameWidth;
        if (this.state === 'activating') {
            sprite = assets.fire_hit;
            texture = textures.fire_hit;
            frameWidth = sprite.width / this.anim.activating.frames;
            srcX = this.frame * frameWidth;
        } else {
            sprite = assets.fire_on;
            texture = textures.fire_on;
            frameWidth = sprite.width / this.anim.on.frames;
            srcX = this.frame * frameWidth;
        }

        if (sprite && texture) {
            const instanceData = [
                startX, this.y - this.height * 1.5,
                this.width, this.height * 2,
                srcX, 0,
                frameWidth, sprite.height,
                0.0
            ];
            results.push({ texture, instanceData });
        }
        return results;
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