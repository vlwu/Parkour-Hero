import { Trap } from './Trap.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';

export class SlammingHead extends Trap {
    constructor(x, y, config) {
        super(x, y, config);

        this.initialY = y;
        this.type = config.type;


        this.spriteKeys = config.spriteKeys;
        this.soundKey = config.soundKey;
        this.velocities = config.velocities;
        this.timersConfig = config.timers;

        this.state = 'idle';
        this.timers = {
            blink: Math.random() * 4 + 2,
            warning: this.timersConfig.warning,
            slammed: this.timersConfig.slammed,
        };

        this.animations = {
            blink: { frameCount: 4, frameSpeed: 0.08, timer: 0, frame: 0 },
            hit: { frameCount: 4, frameSpeed: 0.1, timer: 0, frame: 0 },
        };

        this.shakeOffset = { x: 0, y: 0 };
    }

    get detectionZone() {
        return {
            x: this.x - this.width / 2,
            y: this.y + this.height / 2,
            width: this.width,
            height: 500,
        };
    }

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

        if (playerHitbox.x + playerHitbox.width <= zone.x || playerHitbox.x >= zone.x + zone.width || playerHitbox.y < this.y) {
            return false;
        }

        let detectionBottomY = this.y + this.height / 2 + zone.height;
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const startGridY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
        const endGridY = Math.floor(detectionBottomY / TILE_SIZE);
        const startGridX = Math.floor(zone.x / TILE_SIZE);
        const endGridX = Math.floor((zone.x + zone.width) / TILE_SIZE);

        for (let y = startGridY; y <= endGridY; y++) {
            for (let x = startGridX; x <= endGridX; x++) {
                const tileProps = level.getTilePropertiesAt(x * TILE_SIZE, y * TILE_SIZE);
                if (tileProps && tileProps.solid && !tileProps.oneWay) {
                    detectionBottomY = y * TILE_SIZE;
                    y = endGridY + 1; // Break outer loop
                    break;
                }
            }
        }

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
        const moveDistance = this.velocities.slam * dt;
        const steps = Math.ceil(moveDistance / (GRID_CONSTANTS.TILE_SIZE / 2));
        const stepY = moveDistance / steps;

        for (let i = 0; i < steps; i++) {
            this.y += stepY;
            const groundCheckY = this.y + this.height / 2;

            const hitCollider = this._findSurface(level, groundCheckY);
            if (hitCollider) {
                this.y = hitCollider.y - this.height / 2;
                this.state = 'slammed';
                this.timers.slammed = 0.4;
                this.animations.hit.frame = 0;
                eventBus.publish('playSound', { key: this.soundKey, volume: 1.5, channel: 'SFX' });
                eventBus.publish('cameraShakeRequested', { intensity: 15, duration: 0.3 });
                eventBus.publish('createParticles', { x: this.x, y: this.y + this.height / 2, type: 'walk_dust', particleSpeed: 200 });
                eventBus.publish('createParticles', { x: this.x, y: this.y + this.height / 2, type: 'sand', particleSpeed: 200 });
                return;
            }
        }
    }

    _findSurface(level, checkY) {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const headLeft = this.x - this.width / 2;
        const headRight = this.x + this.width / 2;
        const startGridX = Math.floor(headLeft / TILE_SIZE);
        const endGridX = Math.floor(headRight / TILE_SIZE);

        let highestSurfaceY = Infinity;
        let surfaceFound = false;

        // Check tiles under the head's width
        for (let x = startGridX; x <= endGridX; x++) {
            const tileProps = level.getTilePropertiesAt(x * TILE_SIZE, checkY);
            if (tileProps && tileProps.solid && !tileProps.oneWay) {
                const gridY = Math.floor(checkY / TILE_SIZE);
                const tileTopY = gridY * TILE_SIZE;
                if (tileTopY < highestSurfaceY) {
                    highestSurfaceY = tileTopY;
                    surfaceFound = true;
                }
            }
        }

        // Check dynamic/trap objects
        const queryBox = { x: headLeft, y: checkY - 1, width: this.width, height: 2 };
        const potentialColliders = level.spatialGrid.query(queryBox);

        for (const obj of potentialColliders) {
            if (obj.instance && obj.instance.solid && !obj.isOneWay) {
                const hitbox = obj.instance.hitbox || obj;
                if (
                    headRight > hitbox.x &&
                    headLeft < hitbox.x + hitbox.width &&
                    checkY >= hitbox.y && checkY < hitbox.y + hitbox.height
                ) {
                    if (hitbox.y < highestSurfaceY) {
                        highestSurfaceY = hitbox.y;
                        surfaceFound = true;
                    }
                }
            }
        }

        return surfaceFound ? { y: highestSurfaceY } : null;
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

    getRenderableData(assets, textures) {
        const drawX = this.x - this.width / 2 + this.shakeOffset.x;
        const drawY = this.y - this.height / 2 + this.shakeOffset.y;

        let spriteKey, anim, frame;
        if (this.state === 'blinking') {
            spriteKey = this.spriteKeys.blink;
            anim = this.animations.blink;
            frame = anim.frame;
        } else if (this.state === 'slammed') {
            spriteKey = this.spriteKeys.hit;
            anim = this.animations.hit;
            frame = anim.frame;
        } else {
            spriteKey = this.spriteKeys.idle;
            anim = { frameCount: 1 };
            frame = 0;
        }

        const sprite = assets[spriteKey];
        const texture = textures[spriteKey];
        if (!sprite || !texture) return null;

        const frameWidth = sprite.width / anim.frameCount;
        const sX = frame * frameWidth;

        const instanceData = [drawX, drawY, this.width, this.height, sX, 0, frameWidth, sprite.height, 0.0];
        return { texture, instanceData };
    }

    onCollision(player, eventBus) {
        if (this.state !== 'slamming' && this.state !== 'slammed') return;
        eventBus.publish('collisionEvent', { type: 'hazard', entityId: player.entityId, entityManager: player.entityManager, damage: 1000 });
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