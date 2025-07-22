import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { StateComponent } from '../components/StateComponent.js';

/**
 * Manages the state of player-controlled entities.
 * This includes handling the Finite State Machine (FSM), responding to input
 * to trigger state transitions (like jumping and dashing), and updating animations.
 */
export class PlayerStateSystem {
    constructor() {
        eventBus.subscribe('playerTookDamage', (e) => this.handleDamageTaken(e));
        eventBus.subscribe('playerRespawned', () => {
            this.clearDamageEvents();
            this.clearKnockbackEvents();
        });
        eventBus.subscribe('playerKnockback', (e) => this.handleKnockback(e));
        this.damageEvents = [];
        this.knockbackEvents = [];
    }
    
    clearDamageEvents() {
        this.damageEvents = [];
    }

    clearKnockbackEvents() {
        this.knockbackEvents = [];
    }
    
    handleDamageTaken(event) {
        this.damageEvents.push(event);
    }

    handleKnockback(event) {
        this.knockbackEvents.push(event);
    }

    _processDamageEvents(entityManager) {
        if (this.damageEvents.length === 0) return;
        
        const entities = entityManager.query([PlayerControlledComponent, RenderableComponent, StateComponent]);

        for (const event of this.damageEvents) {
            for (const entityId of entities) {
                const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
                const renderable = entityManager.getComponent(entityId, RenderableComponent);
                const state = entityManager.getComponent(entityId, StateComponent);
                
                // Add a defensive guard: Do not process damage if the player is in an invulnerable state.
                if (ctrl.isHit || ctrl.isSpawning) {
                    continue; 
                }
                
                if ((event.source === 'fall' || event.source === 'fire' || event.source === 'hazard') && !ctrl.isHit) {
                    ctrl.isHit = true;
                    ctrl.hitStunTimer = PLAYER_CONSTANTS.HIT_STUN_DURATION;
                    this._setAnimationState(renderable, state, 'hit', ctrl);
                    eventBus.publish('playSound', { key: 'hit', volume: 0.5, channel: 'SFX' });
                }
            }
        }
        
        this.damageEvents = [];
    }

    _processKnockbackEvents(entityManager) {
        if (this.knockbackEvents.length === 0) return;

        for (const event of this.knockbackEvents) {
            const { entityId, vx, vy } = event;
            const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            
            // The check for `ctrl.isHit` is removed. A knockback event should always apply
            // its velocity. The hit state, which controls animation and input stun, is now handled
            // separately by the `playerTookDamage` event processing.
            if (ctrl) {
                const vel = entityManager.getComponent(entityId, VelocityComponent);
                if (vel) {
                    vel.vx = vx;
                    vel.vy = vy;
                }
            }
        }
        
        this.knockbackEvents = [];
    }

    update(dt, { entityManager }) {
        this._processDamageEvents(entityManager);
        this._processKnockbackEvents(entityManager);

        const entities = entityManager.query([
            PlayerControlledComponent, PositionComponent, VelocityComponent, CollisionComponent,
            RenderableComponent, InputComponent, StateComponent
        ]);

        for (const entityId of entities) {
            const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const renderable = entityManager.getComponent(entityId, RenderableComponent);
            const input = entityManager.getComponent(entityId, InputComponent);
            const state = entityManager.getComponent(entityId, StateComponent);

            this._updateTimers(dt, ctrl);
            this._handleInput(dt, input, pos, vel, ctrl, col, renderable, state);
            this._updateFSM(vel, ctrl, col, renderable, state);
            this._updateAnimation(dt, ctrl, renderable, state);
            this._handleJumpTrail(dt, pos, col, ctrl, state);
            
            if (col.isGrounded) {
                ctrl.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
            }
        }
    }
    
    _handleJumpTrail(dt, pos, col, ctrl, state) {
        if (state.currentState === 'jump' && ctrl.jumpCount === 1) {
            ctrl.jumpParticleTimer -= dt;
            if (ctrl.jumpParticleTimer <= 0) {
                ctrl.jumpParticleTimer = 0.05;
                eventBus.publish('createParticles', { 
                    x: pos.x + col.width / 2, 
                    y: pos.y + col.height,
                    type: 'jump_trail' 
                });
            }
        } else {
            ctrl.jumpParticleTimer = 0;
        }
    }

    _updateTimers(dt, ctrl) {
        if (ctrl.jumpBufferTimer > 0) ctrl.jumpBufferTimer -= dt;
        if (ctrl.coyoteTimer > 0) ctrl.coyoteTimer -= dt;
        if (ctrl.dashCooldownTimer > 0) ctrl.dashCooldownTimer -= dt;

        if (ctrl.isHit) {
            ctrl.hitStunTimer -= dt;
            if (ctrl.hitStunTimer <= 0) {
                ctrl.isHit = false;
            }
        }

        if (ctrl.isDashing) {
            ctrl.dashTimer -= dt;
            if (ctrl.dashTimer <= 0) {
                ctrl.isDashing = false;
            }
        }
    }

    _handleInput(dt, input, pos, vel, ctrl, col, renderable, state) {
        if (ctrl.isSpawning || ctrl.isDashing || ctrl.isDespawning || ctrl.isHit) {
            return;
        }

        if (input.moveLeft) renderable.direction = 'left';
        else if (input.moveRight) renderable.direction = 'right';

        const justPressedJump = input.jump && !ctrl.jumpPressed;

        if (input.jump) {
            ctrl.jumpBufferTimer = PLAYER_CONSTANTS.JUMP_BUFFER_TIME;
        }

        if (ctrl.jumpBufferTimer > 0 && (col.isGrounded || ctrl.coyoteTimer > 0) && ctrl.jumpCount === 0) {
            const jumpForce = ctrl.jumpForce * (col.groundType === 'mud' ? PLAYER_CONSTANTS.MUD_JUMP_MULTIPLIER : 1);
            vel.vy = -jumpForce;
            ctrl.jumpCount = 1;
            ctrl.jumpBufferTimer = 0;
            ctrl.coyoteTimer = 0;
            eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
        } else if (justPressedJump && col.isAgainstWall && !col.isGrounded) {
            vel.vx = (renderable.direction === 'left' ? 1 : -1) * ctrl.speed;
            renderable.direction = renderable.direction === 'left' ? 'right' : 'left';
            vel.vy = -ctrl.jumpForce;
            ctrl.jumpCount = 1;
            eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
        } else if (justPressedJump && ctrl.jumpCount === 1 && !col.isGrounded && !col.isAgainstWall) {
            vel.vy = -ctrl.jumpForce;
            ctrl.jumpCount = 2;
            ctrl.jumpBufferTimer = 0;
            this._setAnimationState(renderable, state, 'double_jump', ctrl);
            eventBus.publish('playSound', { key: 'double_jump', volume: 0.6, channel: 'SFX' });
            eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height, type: 'double_jump' });
        }

        ctrl.jumpPressed = input.jump;

        if (input.dash && !ctrl.dashPressed && ctrl.dashCooldownTimer <= 0) {
            ctrl.isDashing = true;
            ctrl.dashTimer = ctrl.dashDuration;
            vel.vx = renderable.direction === 'right' ? ctrl.dashSpeed : -ctrl.dashSpeed;
            vel.vy = 0;
            ctrl.dashCooldownTimer = PLAYER_CONSTANTS.DASH_COOLDOWN;
            this._setAnimationState(renderable, state, 'dash', ctrl);
            eventBus.publish('playSound', { key: 'dash', volume: 0.7, channel: 'SFX' });
            eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: 'dash', direction: renderable.direction });
        }
        ctrl.dashPressed = input.dash;
    }

    _updateFSM(vel, ctrl, col, renderable, state) {
        const currentState = state.currentState;

        if ((currentState === 'spawn' && !ctrl.spawnComplete) || currentState === 'despawn') {
            return;
        }
        
        if (currentState === 'spawn' && ctrl.spawnComplete) {
            this._setAnimationState(renderable, state, 'idle', ctrl);
            return; 
        }

        if (ctrl.isHit) {
            if (currentState !== 'hit') this._setAnimationState(renderable, state, 'hit', ctrl);
            return;
        }
        
        if (currentState === 'hit' && !ctrl.isHit) {
             this._setAnimationState(renderable, state, 'idle', ctrl);
        }

        if (ctrl.isDashing) {
            if (currentState !== 'dash') this._setAnimationState(renderable, state, 'dash', ctrl);
            return;
        }

        if (col.isAgainstWall && !col.isGrounded && vel.vy >= 0) {
            if (currentState !== 'cling') this._setAnimationState(renderable, state, 'cling', ctrl);
        } else if (!col.isGrounded) {
            if (vel.vy < 0 && currentState !== 'jump' && currentState !== 'double_jump') {
                this._setAnimationState(renderable, state, 'jump', ctrl);
            } else if (vel.vy >= 0 && currentState !== 'fall') {
                this._setAnimationState(renderable, state, 'fall', ctrl);
            }
        } else {
            if (Math.abs(vel.vx) > 1) {
                if (currentState !== 'run') this._setAnimationState(renderable, state, 'run', ctrl);
            } else {
                if (currentState !== 'idle') this._setAnimationState(renderable, state, 'idle', ctrl);
            }
        }
    }

    _setAnimationState(renderable, state, newState, ctrl) {
        if (state.currentState !== newState) {
            state.currentState = newState;
            renderable.animationState = newState;
            renderable.animationFrame = 0;
            renderable.animationTimer = 0;
            if (newState === 'cling') {
                ctrl.jumpCount = 1;
            } else if (newState === 'idle' || newState === 'run') {
                ctrl.jumpCount = 0;
            }
        }
    }

    _updateAnimation(dt, ctrl, renderable, state) {
        renderable.animationTimer += dt;
        const stateName = renderable.animationState;

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
        const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[stateName] || 1.
        renderable.animationFrame++;
        
        if (stateName === 'spawn' || stateName === 'despawn' || stateName === 'hit') {
            if (renderable.animationFrame >= frameCount) {
                renderable.animationFrame = frameCount - 1; // Hold on the last frame
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