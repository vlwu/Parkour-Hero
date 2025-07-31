import { SlammingHead } from './templates/SlammingHead.js';

export class RockHead extends Trap {
    constructor(x, y, config) {
        super(x, y, {
            ...config,
            width: 42,
            height: 42,
            type: 'rock_head',
            spriteKeys: {
                idle: 'rh_idle',
                blink: 'rh_blink',
                hit: 'rh_bottom_hit',
            },
            soundKey: 'rh_slam',
            velocities: {
                slam: 1200,
                retract: 80,
            },
            timers: {
                warning: 0.2,
                slammed: 0.4,
            }
        });
    }
}