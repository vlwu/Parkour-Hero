import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';

/**
 * Applies physics forces and movement rules to entities.
 * This system is responsible for changing entity velocities based on their
 * state and interactions with the environment (e.g., ice, sand).
 */
export class MovementSystem {
    constructor() {}

    update(dt, { entityManager }) {
        const entities = entityManager.query([PlayerControlledComponent, VelocityComponent, CollisionComponent, InputComponent, PositionComponent]);

        for (const entityId of entities) {
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            const input = entityManager.getComponent(entityId, InputComponent);
            const pos = entityManager.getComponent(entityId, PositionComponent);

            if (ctrl.isSpawning || ctrl.isDespawning) {
                vel.vx = 0;
                vel.vy = 0;
                if (ctrl.activeSurfaceSound) {
                    eventBus.publish('stopSoundLoop', { key: ctrl.activeSurfaceSound });
                    ctrl.activeSurfaceSound = null;
                }
                continue;
            };

            this._applyHorizontalMovement(dt, input, vel, col, ctrl);
            this._applyVerticalMovement(dt, vel, col, ctrl);
            this._updateSurfaceEffects(dt, pos, vel, col, ctrl);
        }
    }

    _applyHorizontalMovement(dt, input, vel, col, ctrl) {
        if (ctrl.isDashing || ctrl.isHit) {
            return;
        }

        const applyInput = !ctrl.isPushed;
        ctrl.isPushed = false;

        const GROUND_FRICTION = 1000;

        if (col.isGrounded && col.groundType === 'ice') {
            const acc = PLAYER_CONSTANTS.ICE_ACCELERATION;
            const fric = PLAYER_CONSTANTS.ICE_FRICTION;
            if (applyInput && input.moveLeft) {
                vel.vx -= acc * dt;
            } else if (applyInput && input.moveRight) {
                vel.vx += acc * dt;
            } else {
                if (vel.vx > 0) {
                    vel.vx -= fric * dt;
                    if (vel.vx < 0) vel.vx = 0;
                } else if (vel.vx < 0) {
                    vel.vx += fric * dt;
                    if (vel.vx > 0) vel.vx = 0;
                }
            }
            vel.vx = Math.max(-ctrl.speed, Math.min(ctrl.speed, vel.vx));
        } else {
            const moveSpeed = ctrl.speed * (col.isGrounded && col.groundType === 'sand' ? PLAYER_CONSTANTS.SAND_MOVE_MULTIPLIER : 1);
            if (applyInput && input.moveLeft) {
                vel.vx = -moveSpeed;
            } else if (applyInput && input.moveRight) {
                vel.vx = moveSpeed;
            } else {
                if (vel.vx > 0) {
                    vel.vx -= GROUND_FRICTION * dt;
                    if (vel.vx < 0) vel.vx = 0;
                } else if (vel.vx < 0) {
                    vel.vx += GROUND_FRICTION * dt;
                    if (vel.vx > 0) vel.vx = 0;
                }
            }
        }
    }

    _applyVerticalMovement(dt, vel, col, ctrl) {
        // Only apply gravity if the player is not on the ground, and not in a special state
        if (!col.isGrounded && !ctrl.isDashing && !ctrl.isHit && !ctrl.isSpawning) {
            vel.vy += PLAYER_CONSTANTS.GRAVITY * dt;
        }

        if (col.isAgainstWall && !col.isGrounded) {
            vel.vy = Math.min(vel.vy, 30); // Slower slide speed
        }
        
        vel.vy = Math.min(vel.vy, PLAYER_CONSTANTS.MAX_FALL_SPEED);
    }

    _updateSurfaceEffects(dt, pos, vel, col, ctrl) {
        const onGroundAndMoving = col.isGrounded && Math.abs(vel.vx) > 1 && !ctrl.isDashing && !ctrl.isHit;
        const requiredSound = onGroundAndMoving ? { 'sand': 'sand_walk', 'mud': 'mud_run', 'ice': 'ice_run' }[col.groundType] : null;

        if (requiredSound !== ctrl.activeSurfaceSound) {
            if (ctrl.activeSurfaceSound) eventBus.publish('stopSoundLoop', { key: ctrl.activeSurfaceSound });
            if (requiredSound) eventBus.publish('startSoundLoop', { key: requiredSound, channel: 'SFX' });
            ctrl.activeSurfaceSound = requiredSound;
        }

        if (onGroundAndMoving) {
            ctrl.surfaceParticleTimer += dt;
            const particleInterval = (col.groundType === 'sand' || col.groundType === 'mud') ? 0.1 : 0.15;
            
            if (ctrl.surfaceParticleTimer >= particleInterval) {
                ctrl.surfaceParticleTimer = 0;
                
                let particleType;
                switch (col.groundType) {
                    case 'sand': particleType = 'sand'; break;
                    case 'mud': particleType = 'mud'; break;
                    case 'ice': particleType = 'ice'; break;
                    default:
                        if (col.groundType) { 
                            particleType = 'walk_dust';
                        }
                        break;
                }

                if (particleType) {
                    eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height, type: particleType });
                }
            }
        }
    }
}