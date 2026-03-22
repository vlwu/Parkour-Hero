import { AI_TYPES, ENEMY_STATES } from '../utils/constants.js';

export class EnemyComponent {
    constructor({
        type,
        ai,
        spawnX,
        spawnY,
        initialState
    }) {
        this.type = type;
        this.ai = ai;
        this.spawnX = spawnX;
        this.spawnY = spawnY;
        this.initialState = initialState;

        this.isDead = false;
        this.respawnTimer = 0;
        this.deathTimer = 0;
        this.timer = 0;
        this.immunityTimer = 0;
        if (this.ai.particleDropInterval) {
            this.particleDropTimer = this.ai.particleDropInterval;
        }

        if (this.type === AI_TYPES.GHOST) {
            this.ghostState = ENEMY_STATES.APPEARING;
            this.phaseTimer = 0;
        }
        if (this.type === AI_TYPES.SKULL) {
            this.skullState = ENEMY_STATES.IDLE2;
        }

        if (this.type === AI_TYPES.DEFENSIVE_CYCLE) {
            this.timer = this.ai.spikesInDuration;
        }

        this.aiBehavior = null;
    }
}