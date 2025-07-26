export class EnemyComponent {
    /**
     * Component to tag an entity as an enemy and store its AI and state.
     * @param {object} props The properties for the enemy component.
     * @param {string} props.type The type of the enemy (e.g., 'mushroom').
     * @param {object} props.ai The full AI configuration block from ENEMY_DEFINITIONS.
     */
    constructor({
        type,
        ai
    }) {
        this.type = type;
        this.ai = ai; // Stores the entire AI configuration object

        // Internal state properties managed by the EnemySystem
        this.isDead = false;
        this.deathTimer = 0;
        this.timer = 0; // Generic timer for AI states (e.g., idle, cooldown)
        this.immunityTimer = 0; // Added for immunity when switching phases (eg. rock, snail)
        if (this.ai.particleDropInterval) {
            this.particleDropTimer = this.ai.particleDropInterval;
        }

        // Specific state for Snail enemy
        if (this.type === 'snail') {
            this.snailState = 'walking'; // 'walking', 'shell', 'dying'
        }
    }
}