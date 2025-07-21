export class PeriodicDamageComponent {
    /**
     * A component for hazards that deal damage repeatedly over time.
     * @param {object} props The properties for the component.
     * @param {number} [props.amount=10] The damage dealt per tick.
     * @param {number} [props.interval=1.0] The time in seconds between each damage tick.
     * @param {string} [props.source='fire'] A string identifying the damage source.
     */
    constructor({ amount = 10, interval = 1.0, source = 'fire' } = {}) {
        this.amount = amount;
        this.interval = interval;
        this.source = source;
        // State for tracking damage timing, managed by a system.
        this.damageTimer = 0;
    }
}