export class EnemyComponent {
    /**
     * Component to tag an entity as an enemy and store its AI and state.
     * @param {object} props The properties for the enemy component.
     * @param {string} props.type The type of the enemy (e.g., 'mushroom').
     * @param {string} [props.initialState='patrol'] The starting state for the AI.
     * @param {object} [props.patrol] Defines patrol behavior.
     * @param {number} [props.patrol.startX] The starting X coordinate for the patrol.
     * @param {number} [props.patrol.distance] The distance to patrol from the start.
     * @param {number} [props.patrol.speed] The speed of the patrol.
     * @param {number} [props.aggroRange=150] The distance at which the enemy detects the player.
     */
    constructor({
        type,
        initialState = 'patrol',
        patrol = { startX: 0, distance: 100, speed: 50 },
        aggroRange = 150
    }) {
        this.type = type;
        this.initialState = initialState;
        this.patrol = patrol;
        this.aggroRange = aggroRange;

        // Internal state properties managed by the EnemySystem
        this.isDead = false;
        this.deathTimer = 0; // Countdown for death animation/removal
    }
}