export class HealthComponent {
    /**
     * @param {number} [maxHealth=100] The maximum health of the entity.
     * @param {number} [currentHealth=100] The current health of the entity.
     */
    constructor(maxHealth = 100, currentHealth = 100) {
        this.maxHealth = maxHealth;
        this.currentHealth = currentHealth;
    }
}