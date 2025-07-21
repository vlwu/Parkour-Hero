import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class BouncePlatformComponent {
    /**
     * A component for entities that propel other entities upwards on contact.
     * @param {object} props The properties for the component.
     * @param {number} [props.force=PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER] The upward velocity impulse to apply.
     */
    constructor({ force = PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER } = {}) {
        this.force = force;
    }
}