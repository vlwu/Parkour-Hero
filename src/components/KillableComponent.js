export class KillableComponent {
    /**
     * Marks an entity as killable by the player.
     * @param {object} props The properties for the killable component.
     * @param {boolean} [props.stompable=true] Whether the entity can be killed by a stomp from above.
     * @param {number} [props.stompBounceVelocity=250] The upward velocity applied to the player after a stomp.
     */
    constructor({ stompable = true, stompBounceVelocity = 250 } = {}) {
        this.stompable = stompable;
        this.stompBounceVelocity = stompBounceVelocity;
    }
}