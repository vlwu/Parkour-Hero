import { BaseAI } from './BaseAI.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { ENEMY_STATES, ANIMATION_STATES } from '../utils/constants.js';

export class DefensiveCycleAI extends BaseAI {
    update(dt) {
        this.vel.vx = 0;


        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'extending';
                    this.renderable.animationState = ANIMATION_STATES.SPIKES_OUT;
                    this.renderable.animationFrame = 0;
                    this.renderable.animationTimer = 0;
                }
                break;

            case 'extending':

                const extendingAnim = ENEMY_DEFINITIONS.turtle.animations.spikes_out;
                if (this.renderable.animationFrame >= extendingAnim.frameCount - 1) {
                    this.state.currentState = 'hiding';
                    this.renderable.animationState = ANIMATION_STATES.IDLE1;
                    this.enemy.timer = this.enemy.ai.spikesOutDuration;

                    const killable = this.entityManager.getComponent(this.entityId, KillableComponent);
                    if (killable) {
                        killable.stompable = false;
                        killable.dealsContactDamage = true;
                    }
                }
                break;

            case 'hiding':
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'retracting';
                    this.renderable.animationState = ANIMATION_STATES.SPIKES_IN;
                    this.renderable.animationFrame = 0;
                    this.renderable.animationTimer = 0;
                }
                break;

            case 'retracting':
                const retractingAnim = ENEMY_DEFINITIONS.turtle.animations.spikes_in;
                if (this.renderable.animationFrame >= retractingAnim.frameCount - 1) {
                    this.state.currentState = ENEMY_STATES.IDLE;
                    this.renderable.animationState = ANIMATION_STATES.IDLE2;
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