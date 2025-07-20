import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class PlayerControlledComponent {
    /**
     * @param {object} [props={}] The properties for the player-controlled component.
     * @param {number} [props.speed] The movement speed of the player.
     * @param {number} [props.jumpForce] The initial force of the player's jump.
     * @param {number} [props.dashSpeed] The speed of the player's dash.
     * @param {number} [props.dashDuration] The duration of the player's dash in seconds.
     * @param {number} [props.jumpBufferTimer=0] Timer to buffer jump inputs.
     * @param {number} [props.coyoteTimer=0] Timer for allowing jumps shortly after leaving a ledge.
     * @param {number} [props.dashTimer=0] Timer for the current dash duration.
     * @param {number} [props.dashCooldownTimer=0] Timer for the cooldown between dashes.
     * @param {boolean} [props.isDashing=false] The current dashing state.
     * @param {number} [props.jumpCount=0] The number of jumps performed (for double jump).
     */
    constructor({
        speed = PLAYER_CONSTANTS.MOVE_SPEED,
        jumpForce = PLAYER_CONSTANTS.JUMP_FORCE,
        dashSpeed = PLAYER_CONSTANTS.DASH_SPEED,
        dashDuration = PLAYER_CONSTANTS.DASH_DURATION,
        jumpBufferTimer = 0,
        coyoteTimer = 0,
        dashTimer = 0,
        dashCooldownTimer = 0,
        isDashing = false,
        jumpCount = 0
    } = {}) {
        this.speed = speed;
        this.jumpForce = jumpForce;
        this.dashSpeed = dashSpeed;
        this.dashDuration = dashDuration;
        
        this.jumpBufferTimer = jumpBufferTimer;
        this.coyoteTimer = coyoteTimer;
        this.dashTimer = dashTimer;
        this.dashCooldownTimer = dashCooldownTimer;

        this.isDashing = isDashing;
        this.jumpCount = jumpCount;
    }
}