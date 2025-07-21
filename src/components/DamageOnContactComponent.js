export class DamageOnContactComponent {
    /**
     * A component for entities that deal damage upon direct collision.
     * @param {object} props The properties for the component.
     * @param {number} [props.amount=25] The amount of damage to inflict.
     * @param {string} [props.source='trap'] A string identifying the damage source for sound or effects.
     * @param {number} [props.knockbackForce=0] The force to push the player back with.
     */
    constructor({ amount = 25, source = 'trap', knockbackForce = 0 } = {}) {
        this.amount = amount;
        this.source = source;
        this.knockbackForce = knockbackForce;
    }
}