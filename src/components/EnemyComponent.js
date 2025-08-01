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

        if (this.type === 'snail') {
            this.snailState = 'walking';
        }
        if (this.type === 'ghost') {
            this.ghostState = 'appearing';
            this.phaseTimer = 0;
        }

        if (this.type === 'turtle') {
            this.timer = this.ai.spikesInDuration;
        }

        this.aiBehavior = null;
    }
}