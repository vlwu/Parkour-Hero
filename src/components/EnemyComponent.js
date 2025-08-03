import { AI_TYPES, ENEMY_STATES } from '../utils/constants.js';

export class EnemyComponent {
    constructor({
        type,
        ai
    }) {
        this.type = type;
        this.ai = ai;

        this.isDead = false;
        this.deathTimer = 0;
        this.timer = 0;
        this.immunityTimer = 0;
        if (this.ai.particleDropInterval) {
            this.particleDropTimer = this.ai.particleDropInterval;
        }

        if (this.type === AI_TYPES.SNAIL) {
            this.snailState = ENEMY_STATES.WALKING;
        }
        if (this.type === AI_TYPES.ANGRYPIG) {
            this.angryPigState = ENEMY_STATES.WALKING;
        }
        if (this.type === AI_TYPES.GHOST) {
            this.ghostState = ENEMY_STATES.APPEARING;
            this.phaseTimer = 0;
        }

        if (this.type === AI_TYPES.DEFENSIVE_CYCLE) {
            this.timer = this.ai.spikesInDuration;
        }

        this.aiBehavior = null;
    }
}