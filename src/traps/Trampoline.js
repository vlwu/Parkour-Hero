import { Trap } from './templates/Trap.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class Trampoline extends Trap {
    constructor(x, y, config) {
        super(x, y, { ...config, width: 28, height: 28 });

        this.state = 'idle';
        this.frame = 0;
        this.frameCount = 8;
        this.frameSpeed = 0.05;
        this.frameTimer = 0;
    }

    update(dt) {
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

    onCollision(player, eventBus) {
        const { pos, vel, col } = player;

        vel.vy = -PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER;

        pos.y = (this.y - this.height / 2) - col.height;

        this.state = 'jumping';
        this.frame = 0;
        this.frameTimer = 0;
        eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
    }

    reset() {
        this.state = 'idle';
        this.frame = 0;
        this.frameTimer = 0;
    }
}