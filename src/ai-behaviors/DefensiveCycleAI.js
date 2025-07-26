import { BaseAI } from './BaseAI.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';

export class DefensiveCycleAI extends BaseAI {
    update(dt) {
        this.vel.vx = 0; // The turtle doesn't move.

        // The state machine for the turtle's defensive cycle.
        switch (this.state.currentState) {
            case 'idle': // Vulnerable, spikes are in.
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'extending';
                    this.renderable.animationState = 'spikes_out';
                    this.renderable.animationFrame = 0;
                    this.renderable.animationTimer = 0;
                }
                break;

            case 'extending': // Spikes are coming out.
                // The animation system updates the frame. We check if it's done.
                const extendingAnim = ENEMY_DEFINITIONS.turtle.animations.spikes_out;
                if (this.renderable.animationFrame >= extendingAnim.frameCount - 1) {
                    this.state.currentState = 'hiding'; // Invulnerable state
                    this.renderable.animationState = 'idle1';
                    this.enemy.timer = this.enemy.ai.spikesOutDuration;

                    const killable = this.entityManager.getComponent(this.entityId, KillableComponent);
                    if (killable) {
                        killable.stompable = false;
                        killable.dealsContactDamage = true;
                    }
                }
                break;

            case 'hiding': // Invulnerable, spikes are out.
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'retracting';
                    this.renderable.animationState = 'spikes_in';
                    this.renderable.animationFrame = 0;
                    this.renderable.animationTimer = 0;
                }
                break;

            case 'retracting': // Spikes are going in.
                const retractingAnim = ENEMY_DEFINITIONS.turtle.animations.spikes_in;
                if (this.renderable.animationFrame >= retractingAnim.frameCount - 1) {
                    this.state.currentState = 'idle'; // Vulnerable state
                    this.renderable.animationState = 'idle2';
                    this.enemy.timer = this.enemy.ai.spikesInDuration;

                    const killable = this.entityManager.getComponent(this.entityId, KillableComponent);
                    if (killable) {
                        killable.stompable = true;
                        killable.dealsContactDamage = false;
                    }
                }
                break;
        }
    }
}