import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class PlayerControlledComponent {
    constructor({
        speed = PLAYER_CONSTANTS.MOVE_SPEED,
        jumpForce = PLAYER_CONSTANTS.JUMP_FORCE,
        dashSpeed = PLAYER_CONSTANTS.DASH_SPEED,
        dashDuration = PLAYER_CONSTANTS.DASH_DURATION,
        stats = {}
    } = {}) {
        this.baseSpeed = speed;
        this.speed = speed * (stats.speedMult || 1.0);
        this.baseJumpForce = jumpForce;
        this.baseDashDuration = dashDuration;
        this.dashSpeed = dashSpeed;

        // Apply Character Stats
        this.maxJumps = stats.maxJumps || 2;
        this.jumpForce = this.baseJumpForce * (stats.jumpForceMult || 1.0);
        
        this.maxDashes = stats.maxDashes || 1;
        this.dashCooldownMult = stats.dashCooldownMult || 1.0;
        this.dashDuration = this.baseDashDuration * (stats.dashDurationMult || 1.0);
        
        this.ignoreSurfaceEffects = stats.ignoreSurfaceEffects || false;
        this.detectTraps = stats.detectTraps || false;

        // Stat Modifiers for Mutators
        this.gravityMult = stats.gravityMult ?? 1.0;
        this.damageTakenMult = stats.damageTakenMult ?? 1.0;
        this.coinMultiplier = stats.coinMultiplier ?? 1.0;
        this.pacifist = stats.pacifist ?? false;
        this.bouncyWorld = stats.bouncyWorld ?? false;
        this.lunarCycle = stats.lunarCycle ?? false;
        this.lunarTimer = 0;

        this.currentDashCount = 0;

        // State
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.hitStunTimer = 0;
        this.surfaceParticleTimer = 0;
        this.jumpParticleTimer = 0;

        this.jumpCount = 0;
        this.isDashing = false;
        this.isHit = false;
        this.isDead = false;
        this.respawnDelayTimer = 0;
        
        this.isSpawning = true;
        this.spawnComplete = false;
        this.isDespawning = false;
        this.despawnAnimationFinished = false;
        this.needsRespawn = false;
        this.hLock = false;
        this.vLock = false;
        this.inputLocked = false;

        this.deathCount = 0;
        this.activeSurfaceSound = null;
        this.previousGroundEntity = null;
        this.fallDistance = 0;
        this.isInMud = false;
        this.mudSinkAmount = PLAYER_CONSTANTS.HEIGHT / 5;
        this.jumpedFromMud = false;

        this.currentState = null;
    }
}