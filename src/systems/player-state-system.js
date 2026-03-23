import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { StateComponent } from '../components/StateComponent.js';

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

    clearDamageEvents() { this.damageEvents = []; }
    clearKnockbackEvents() { this.knockbackEvents = []; }
    clearStompEvents() { this.stompEvents = []; }

    handleDamageTaken(event) { this.damageEvents.push(event); }
    handleKnockback(event) { this.knockbackEvents.push(event); }
    handleEnemyStomped(event) { this.stompEvents.push(event); }

    _transitionTo(entityId, newState, entityManager) {
        const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
        if (ctrl.currentState) {
            ctrl.currentState.exit();
        }
        ctrl.currentState = newState;
        ctrl.currentState.enter();
    }

    update(dt, { entityManager, gameState }) {

        this._processDamageEvents(entityManager);
        this._processKnockbackEvents(entityManager);
        this._processStompEvents(entityManager);

        const entities = entityManager.query([ PlayerControlledComponent, StateComponent ]);

        for (const entityId of entities) {
            const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const pos = entityManager.getComponent(entityId, PositionComponent);

            if (ctrl.jumpedFromMud && !ctrl.isInMud) {
                ctrl.jumpedFromMud = false;
            }

            if (!ctrl.currentState) {
                this._transitionTo(entityId, new SpawnState(entityId, entityManager), entityManager);
            }

            // Reset Dash Count if Grounded
            if (col.isGrounded) {
                ctrl.currentDashCount = 0;
            }

            this._updateTimers(dt, ctrl);
            this._handleGlobalInputLogic(entityId, entityManager, gameState);


            if (ctrl.currentState) {
                const nextState = ctrl.currentState.update(dt);
                if (nextState) {
                    this._transitionTo(entityId, nextState, entityManager);
                }
            }

            if (ctrl.isInMud && ctrl.currentState.constructor !== IdleState) {
                this._transitionTo(entityId, new IdleState(entityId, entityManager), entityManager);
            }

            this._updateAnimation(dt, entityId, entityManager);
            this._handleJumpTrail(dt, entityId, entityManager);
            this._handleAura(dt, entityId, pos, col, ctrl, gameState);

            // Continuous Dash trail
            if (ctrl.isDashing && gameState && gameState.equippedCosmetics) {
                ctrl.dashParticleTimer = (ctrl.dashParticleTimer || 0) + dt;
                if (ctrl.dashParticleTimer > 0.03) {
                    ctrl.dashParticleTimer = 0;
                    const renderable = entityManager.getComponent(entityId, RenderableComponent);
                    eventBus.publish('createParticles', { 
                        x: pos.x + col.width / 2, 
                        y: pos.y + col.height / 2, 
                        type: gameState.equippedCosmetics.dash, 
                        direction: renderable.direction 
                    });
                }
            }

            if (col.isGrounded) {
                ctrl.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
            }
        }
    }
    
    _handleAura(dt, entityId, pos, col, ctrl, gameState) {
        if (!ctrl.spawnComplete || ctrl.isSpawning || ctrl.isDespawning || ctrl.isHit || ctrl.isDead) return;
        if (!gameState || !gameState.equippedCosmetics) return;
        
        const equippedAura = gameState.equippedCosmetics.aura;
        ctrl.auraTimer = (ctrl.auraTimer || 0) + dt;
        
        if (equippedAura === 'supercharge_aura' && ctrl.auraTimer > 0.05) {
            ctrl.auraTimer = 0;
            eventBus.publish('createParticles', { type: 'supercharge_aura', x: pos.x + col.width/2, y: pos.y + col.height });
        } else if (equippedAura === 'shadow_aura' && ctrl.auraTimer > 0.08) {
            ctrl.auraTimer = 0;
            eventBus.publish('createParticles', { type: 'shadow_aura', x: pos.x + col.width/2, y: pos.y + col.height/2 });
        } else if (equippedAura === 'orbiting_aura') {
            const angle1 = performance.now() / 300;
            const angle2 = angle1 + Math.PI;
            const radius = 20;
            eventBus.publish('createParticles', { type: 'orbit_node', x: pos.x + col.width/2 + Math.cos(angle1)*radius, y: pos.y + col.height/2 + Math.sin(angle1)*radius });
            eventBus.publish('createParticles', { type: 'orbit_node', x: pos.x + col.width/2 + Math.cos(angle2)*radius, y: pos.y + col.height/2 + Math.sin(angle2)*radius });
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
                // Reset dashes on stomp
                ctrl.currentDashCount = 0;
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

    _handleGlobalInputLogic(entityId, entityManager, gameState) {
        const input = entityManager.getComponent(entityId, InputComponent);
        const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
        const renderable = entityManager.getComponent(entityId, RenderableComponent);
        const vel = entityManager.getComponent(entityId, VelocityComponent);
        const col = entityManager.getComponent(entityId, CollisionComponent);
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const state = entityManager.getComponent(entityId, StateComponent);

        if (state.currentState === 'spawn' || state.currentState === 'despawn' || state.currentState === 'hit' || ctrl.inputLocked || ctrl.needsRespawn) {
            return;
        }

        if (ctrl.isInMud) {
            input.moveLeft = false;
            input.moveRight = false;
            if (input.jumpPressedThisFrame) {
                vel.vy = -ctrl.jumpForce;
                ctrl.jumpCount = 1;
                ctrl.isInMud = false;
                ctrl.jumpedFromMud = true;
                eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
                this._transitionTo(entityId, new JumpState(entityId, entityManager), entityManager);
            }
            return;
        }

        if (ctrl.jumpedFromMud) {
            input.moveLeft = false;
            input.moveRight = false;
        }

        if (!ctrl.isDashing && state.currentState !== 'cling') {
            if (input.moveLeft) {
                renderable.direction = 'left';
            } else if (input.moveRight) {
                renderable.direction = 'right';
            }
        }

        if (state.currentState === 'dash') {
            return;
        }

        if (!ctrl.vLock) {
            if (input.jump) ctrl.jumpBufferTimer = PLAYER_CONSTANTS.JUMP_BUFFER_TIME;

            const justPressedJump = input.jumpPressedThisFrame;

            if (ctrl.jumpBufferTimer > 0 && (col.isGrounded || ctrl.coyoteTimer > 0) && ctrl.jumpCount === 0) {
                // First Jump
                vel.vy = -ctrl.jumpForce;
                ctrl.jumpCount = 1;
                ctrl.jumpBufferTimer = 0;
                ctrl.coyoteTimer = 0;
                eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
                this._transitionTo(entityId, new JumpState(entityId, entityManager), entityManager);
            } else if (justPressedJump && col.isAgainstWall && !col.isGrounded) {
                // Wall Jump
                vel.vx = (renderable.direction === 'left' ? 1 : -1) * ctrl.speed;
                renderable.direction = renderable.direction === 'left' ? 'right' : 'left';
                vel.vy = -ctrl.jumpForce;
                // Wall jump doesn't consume multi-jump counters if standard wall jump
                ctrl.jumpCount = 1; 
                this._transitionTo(entityId, new JumpState(entityId, entityManager), entityManager);
                eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
            } else if (justPressedJump && ctrl.jumpCount > 0 && ctrl.jumpCount < ctrl.maxJumps && !col.isGrounded && !col.isAgainstWall) {
                // Multi Jump (Double/Triple)
                vel.vy = -ctrl.jumpForce;
                ctrl.jumpCount++;
                ctrl.jumpBufferTimer = 0;
                eventBus.publish('playSound', { key: 'double_jump', volume: 0.6, channel: 'SFX' });
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height, type: 'double_jump' });
                this._transitionTo(entityId, new DoubleJumpState(entityId, entityManager), entityManager);
            }
        }
        ctrl.vLock = false;

        // Multi Dash Logic
        if (input.dashPressedThisFrame && ctrl.dashCooldownTimer <= 0 && ctrl.currentDashCount < ctrl.maxDashes) {
            ctrl.isDashing = true;
            ctrl.currentDashCount++;
            ctrl.dashTimer = ctrl.dashDuration;
            vel.vx = renderable.direction === 'right' ? ctrl.dashSpeed : -ctrl.dashSpeed;
            vel.vy = 0;
            ctrl.dashCooldownTimer = PLAYER_CONSTANTS.DASH_COOLDOWN * ctrl.dashCooldownMult;
            eventBus.publish('playSound', { key: 'dash', volume: 0.7, channel: 'SFX' });
            
            const dashType = gameState.equippedCosmetics ? gameState.equippedCosmetics.dash : 'default_dash';
            eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: dashType, direction: renderable.direction });
            
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
        const animDef = PLAYER_CONSTANTS.ANIMATIONS[stateName];
        if (!animDef) return;

        if (renderable.animationTimer < animDef.speed) return;

        renderable.animationTimer -= animDef.speed;
        renderable.animationFrame++;

        if (stateName === 'spawn' || stateName === 'despawn' || stateName === 'hit') {
            if (renderable.animationFrame >= animDef.frameCount) {
                renderable.animationFrame = animDef.frameCount - 1;
                if (stateName === 'spawn') {
                    ctrl.isSpawning = false;
                    ctrl.spawnComplete = true;
                    renderable.width = PLAYER_CONSTANTS.SPRITE_WIDTH;
                    renderable.height = PLAYER_CONSTANTS.SPRITE_HEIGHT;
                    eventBus.publish('playSound', { key: 'spawned', volume: 0.8, channel: 'SFX' });
                }
                if (stateName === 'despawn') {
                    ctrl.despawnAnimationFinished = true;
                }
            }
        } else {
            renderable.animationFrame %= animDef.frameCount;
        }
    }
}