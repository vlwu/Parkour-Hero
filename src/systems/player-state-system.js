import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { StateComponent } from '../components/StateComponent.js';

// Import all the new state classes
import { SpawnState } from '../states/player/SpawnState.js';
import { IdleState } from '../states/player/IdleState.js';
import { JumpState } from '../states/player/JumpState.js';
import { DoubleJumpState } from '../states/player/DoubleJumpState.js';
import { DashState } from '../states/player/DashState.js';
import { HitState } from '../states/player/HitState.js';


export class PlayerStateSystem {
    constructor() {
        eventBus.subscribe('playerTookDamage', (e) => this.handleDamageTaken(e));
        eventBus.subscribe('playerRespawned', () => {
            this.clearDamageEvents();
            this.clearKnockbackEvents();
            this.clearStompEvents();
        });
        eventBus.subscribe('playerKnockback', (e) => this.handleKnockback(e));
        eventBus.subscribe('enemyStomped', (e) => this.handleEnemyStomped(e));
        
        this.damageEvents = [];
        this.knockbackEvents = [];
        this.stompEvents = [];
    }

    // --- Event Handling ---
    clearDamageEvents() { this.damageEvents = []; }
    clearKnockbackEvents() { this.knockbackEvents = []; }
    clearStompEvents() { this.stompEvents = []; }

    handleDamageTaken(event) { this.damageEvents.push(event); }
    handleKnockback(event) { this.knockbackEvents.push(event); }
    handleEnemyStomped(event) { this.stompEvents.push(event); }

    // --- State Machine Transition ---
    _transitionTo(entityId, newState, entityManager) {
        const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
        if (ctrl.currentState) {
            ctrl.currentState.exit();
        }
        ctrl.currentState = newState;
        ctrl.currentState.enter();
    }
    
    // --- System Update Method ---
    update(dt, { entityManager }) {
        // Process discrete events first
        this._processDamageEvents(entityManager);
        this._processKnockbackEvents(entityManager);
        this._processStompEvents(entityManager);

        const entities = entityManager.query([ PlayerControlledComponent, StateComponent ]);

        for (const entityId of entities) {
            const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            
            // Initialize state machine on first run
            if (!ctrl.currentState) {
                this._transitionTo(entityId, new SpawnState(entityId, entityManager), entityManager);
            }

            // Update timers and core logic that affects all states
            this._updateTimers(dt, ctrl);
            this._handleGlobalInputLogic(entityId, entityManager);

            // Delegate state-specific logic and check for a returned state transition
            if (ctrl.currentState) {
                const nextState = ctrl.currentState.update(dt);
                if (nextState) {
                    this._transitionTo(entityId, nextState, entityManager);
                }
            }
            
            // Update animation and other continuous processes
            this._updateAnimation(dt, entityId, entityManager);
            this._handleJumpTrail(dt, entityId, entityManager);

            if (entityManager.getComponent(entityId, CollisionComponent).isGrounded) {
                ctrl.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
            }
        }
    }

    _processDamageEvents(entityManager) {
        if (this.damageEvents.length === 0) return;
        const entities = entityManager.query([PlayerControlledComponent]);
        for (const entityId of entities) {
            const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            if (ctrl.isHit || ctrl.isSpawning) continue;
            
            ctrl.isHit = true;
            ctrl.hitStunTimer = PLAYER_CONSTANTS.HIT_STUN_DURATION;
            this._transitionTo(entityId, new HitState(entityId, entityManager), entityManager);
            eventBus.publish('playSound', { key: 'hit', volume: 0.5, channel: 'SFX' });
        }
        this.damageEvents = [];
    }

    _processKnockbackEvents(entityManager) {
        if (this.knockbackEvents.length === 0) return;
        for (const event of this.knockbackEvents) {
            const { entityId, vx, vy } = event;
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            if (vel) {
                vel.vx = vx;
                vel.vy = vy;
            }
        }
        this.knockbackEvents = [];
    }

    _processStompEvents(entityManager) {
        if (this.stompEvents.length === 0) return;
        const entities = entityManager.query([PlayerControlledComponent, VelocityComponent]);
        for (const event of this.stompEvents) {
            for (const entityId of entities) {
                const vel = entityManager.getComponent(entityId, VelocityComponent);
                const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
                vel.vy = -event.stompBounceVelocity;
                ctrl.jumpCount = 1;
            }
        }
        this.stompEvents = [];
    }

    _updateTimers(dt, ctrl) {
        if (ctrl.jumpBufferTimer > 0) ctrl.jumpBufferTimer -= dt;
        if (ctrl.coyoteTimer > 0) ctrl.coyoteTimer -= dt;
        if (ctrl.dashCooldownTimer > 0) ctrl.dashCooldownTimer -= dt;

        if (ctrl.isHit) {
            ctrl.hitStunTimer -= dt;
            if (ctrl.hitStunTimer <= 0) ctrl.isHit = false;
        }

        if (ctrl.isDashing) {
            ctrl.dashTimer -= dt;
            if (ctrl.dashTimer <= 0) ctrl.isDashing = false;
        }
    }
    
    _handleGlobalInputLogic(entityId, entityManager) {
        const input = entityManager.getComponent(entityId, InputComponent);
        const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
        const renderable = entityManager.getComponent(entityId, RenderableComponent);
        const vel = entityManager.getComponent(entityId, VelocityComponent);
        const col = entityManager.getComponent(entityId, CollisionComponent);
        const pos = entityManager.getComponent(entityId, PositionComponent);

        if (ctrl.isSpawning || ctrl.isDashing || ctrl.isDespawning || ctrl.isHit) {
            return;
        }

        if (input.moveLeft) renderable.direction = 'left';
        else if (input.moveRight) renderable.direction = 'right';

        if (!ctrl.vLock) {
            if (input.jump) ctrl.jumpBufferTimer = PLAYER_CONSTANTS.JUMP_BUFFER_TIME;

            const justPressedJump = input.jumpPressedThisFrame;

            if (ctrl.jumpBufferTimer > 0 && (col.isGrounded || ctrl.coyoteTimer > 0) && ctrl.jumpCount === 0) {
                vel.vy = -ctrl.jumpForce * (col.groundType === 'mud' ? PLAYER_CONSTANTS.MUD_JUMP_MULTIPLIER : 1);
                ctrl.jumpCount = 1;
                ctrl.jumpBufferTimer = 0;
                ctrl.coyoteTimer = 0;
                eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
                this._transitionTo(entityId, new JumpState(entityId, entityManager), entityManager);
            } else if (justPressedJump && col.isAgainstWall && !col.isGrounded) {
                vel.vx = (renderable.direction === 'left' ? 1 : -1) * ctrl.speed;
                renderable.direction = renderable.direction === 'left' ? 'right' : 'left';
                vel.vy = -ctrl.jumpForce;
                this._transitionTo(entityId, new JumpState(entityId, entityManager), entityManager);
                eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
            } else if (justPressedJump && ctrl.jumpCount === 1 && !col.isGrounded && !col.isAgainstWall) {
                vel.vy = -ctrl.jumpForce;
                ctrl.jumpCount = 2;
                ctrl.jumpBufferTimer = 0;
                eventBus.publish('playSound', { key: 'double_jump', volume: 0.6, channel: 'SFX' });
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height, type: 'double_jump' });
                this._transitionTo(entityId, new DoubleJumpState(entityId, entityManager), entityManager);
            }
        }
        ctrl.vLock = false;
        
        if (input.dashPressedThisFrame && ctrl.dashCooldownTimer <= 0) {
            ctrl.isDashing = true;
            ctrl.dashTimer = ctrl.dashDuration;
            vel.vx = renderable.direction === 'right' ? ctrl.dashSpeed : -ctrl.dashSpeed;
            vel.vy = 0;
            ctrl.dashCooldownTimer = PLAYER_CONSTANTS.DASH_COOLDOWN;
            eventBus.publish('playSound', { key: 'dash', volume: 0.7, channel: 'SFX' });
            eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: 'dash', direction: renderable.direction });
            this._transitionTo(entityId, new DashState(entityId, entityManager), entityManager);
        }
    }

    _handleJumpTrail(dt, entityId, entityManager) {
        const state = entityManager.getComponent(entityId, StateComponent);
        const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const col = entityManager.getComponent(entityId, CollisionComponent);
        
        if (state.currentState === 'jump' && ctrl.jumpCount === 1) {
            ctrl.jumpParticleTimer -= dt;
            if (ctrl.jumpParticleTimer <= 0) {
                ctrl.jumpParticleTimer = 0.05;
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height, type: 'jump_trail' });
            }
        } else {
            ctrl.jumpParticleTimer = 0;
        }
    }
    
    _updateAnimation(dt, entityId, entityManager) {
        const renderable = entityManager.getComponent(entityId, RenderableComponent);
        const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);

        renderable.animationTimer += dt;
        const stateName = renderable.animationState;

        // Revert to the original, correct logic for determining animation speed.
        let speed;
        if (stateName === 'spawn' || stateName === 'despawn') {
            speed = PLAYER_CONSTANTS.SPAWN_ANIMATION_SPEED;
        } else if (stateName === 'hit') {
            speed = PLAYER_CONSTANTS.HIT_ANIMATION_SPEED;
        } else {
            speed = PLAYER_CONSTANTS.ANIMATION_SPEED;
        }

        if (renderable.animationTimer < speed) return;

        renderable.animationTimer -= speed;
        const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[stateName] || 1;
        renderable.animationFrame++;

        if (stateName === 'spawn' || stateName === 'despawn' || stateName === 'hit') {
            if (renderable.animationFrame >= frameCount) {
                renderable.animationFrame = frameCount - 1;
                if (stateName === 'spawn') {
                    ctrl.isSpawning = false;
                    ctrl.spawnComplete = true;
                    renderable.width = PLAYER_CONSTANTS.WIDTH;
                    renderable.height = PLAYER_CONSTANTS.HEIGHT;
                }
                if (stateName === 'despawn') {
                    ctrl.isDespawning = false;
                    ctrl.despawnAnimationFinished = true;
                }
            }
        } else {
            renderable.animationFrame %= frameCount;
        }
    }
}