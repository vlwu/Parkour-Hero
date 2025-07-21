export class EnemyAIComponent {
    /**
     * A component that defines the behavior and state for an enemy entity.
     * @param {object} props The properties for the component.
     * @param {'patrol' | 'chase' | 'flee' | 'stationary_shooter'} [props.type='patrol'] The primary behavior type.
     * @param {number} [props.speed=50] The movement speed of the enemy.
     * @param {Array<object>} [props.patrolPath=[]] An array of {x, y} points for patrolling.
     * @param {number} [props.visionRange=250] How far the enemy can "see" the player.
     * @param {number} [props.attackRange=50] The range within which the enemy will perform its attack.
     * @param {number} [props.attackCooldown=1.5] The time in seconds between attacks.
     */
    constructor({
        type = 'patrol',
        speed = 50,
        patrolPath = [],
        visionRange = 250,
        attackRange = 50,
        attackCooldown = 1.5
    } = {}) {
        this.type = type;
        this.speed = speed;
        this.patrolPath = patrolPath;
        this.visionRange = visionRange;
        this.attackRange = attackRange;
        this.attackCooldown = attackCooldown;

        // --- Internal State ---
        // These properties will be managed by the AI system.
        this.currentState = 'patrolling'; // e.g., 'patrolling', 'chasing', 'attacking', 'returning'
        this.targetEntity = null; // The entity the AI is currently focused on (e.g., the player).
        this.currentPatrolIndex = 0;
        this.attackTimer = 0;
        this.lastKnownTargetPosition = null;
    }
}