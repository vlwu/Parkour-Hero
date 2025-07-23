import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class PlayerControlledComponent {
    constructor({
        speed = PLAYER_CONSTANTS.MOVE_SPEED,
        jumpForce = PLAYER_CONSTANTS.JUMP_FORCE,
        dashSpeed = PLAYER_CONSTANTS.DASH_SPEED,
        dashDuration = PLAYER_CONSTANTS.DASH_DURATION,
        jumpBufferTimer = 0,
        coyoteTimer = 0,
        dashTimer = 0,
        dashCooldownTimer = 0,
        hitStunTimer = 0,
        jumpCount = 0,
        isDashing = false,
        isHit = false,
        isSpawning = true,
        spawnComplete = false,
        isDespawning = false,
        despawnAnimationFinished = false,
        needsRespawn = false,
        deathCount = 0,
        activeSurfaceSound = null,
        surfaceParticleTimer = 0,
        jumpParticleTimer = 0,
        jumpPressed = false, 
        dashPressed = false,
        isPushed = false
    } = {}) {
        this.speed = speed;
        this.jumpForce = jumpForce;
        this.dashSpeed = dashSpeed;
        this.dashDuration = dashDuration;
        
        // Timers
        this.jumpBufferTimer = jumpBufferTimer;
        this.coyoteTimer = coyoteTimer;
        this.dashTimer = dashTimer;
        this.dashCooldownTimer = dashCooldownTimer;
        this.hitStunTimer = hitStunTimer;
        this.surfaceParticleTimer = surfaceParticleTimer;
        this.jumpParticleTimer = jumpParticleTimer;

        // States
        this.jumpCount = jumpCount;
        this.isDashing = isDashing;
        this.isHit = isHit;
        this.isSpawning = isSpawning;
        this.spawnComplete = spawnComplete;
        this.isDespawning = isDespawning;
        this.despawnAnimationFinished = despawnAnimationFinished;
        this.needsRespawn = needsRespawn;
        this.isPushed = isPushed;
        
        // Input "edge-case" tracking
        this.jumpPressed = jumpPressed;
        this.dashPressed = dashPressed;
        
        // Stats & Sounds
        this.deathCount = deathCount;
        this.activeSurfaceSound = activeSurfaceSound;
    }
}