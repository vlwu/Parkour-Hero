import { SlammingHead } from './templates/SlammingHead.js';

export class SpikeHead extends SlammingHead {
    constructor(x, y, config) {
        super(x, y, {
            ...config,
            width: 54,
            height: 52,
            type: 'spike_head',
            spriteKeys: {
                idle: 'sh_idle',
                blink: 'sh_blink',
                hit: 'sh_bottom_hit',
            },
            soundKey: 'sh_slam',
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