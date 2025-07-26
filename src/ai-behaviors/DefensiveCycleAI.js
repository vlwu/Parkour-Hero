import { BaseAI } from './BaseAI.js';

export class DefensiveCycleAI extends BaseAI {
    update(dt) {
        this.vel.vx = 0;
        this.enemy.timer -= dt;

        if (this.enemy.timer <= 0) {
            if (this.state.currentState === 'idle') {
                // Start extending spikes
                this.state.currentState = 'spikes_out_transition';
                this.renderable.animationState = 'spikes_out';
                this.renderable.animationFrame = 0;
            } else if (this.state.currentState === 'hiding') {
                // Start retracting spikes
                this.state.currentState = 'spikes_in_transition';
                this.renderable.animationState = 'spikes_in';
                this.renderable.animationFrame = 0;
            }
        }
    }
}