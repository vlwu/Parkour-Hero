import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { StateComponent } from '../components/StateComponent.js';

export class MovementSystem {
    constructor() {}

    update(dt, { entityManager }) {
        const entities = entityManager.query([PlayerControlledComponent, VelocityComponent, CollisionComponent, InputComponent, PositionComponent, StateComponent]);

        for (const entityId of entities) {
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            const input = entityManager.getComponent(entityId, InputComponent);
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const state = entityManager.getComponent(entityId, StateComponent);

            if (ctrl.isSpawning || ctrl.isDespawning) {
                vel.vx = 0;
                vel.vy = 0;
                continue;
            };

            this._applyHorizontalMovement(dt, input, vel, col, ctrl);
            this._applyVerticalMovement(dt, vel, col, ctrl, state);
            this._updateSurfaceEffects(dt, pos, vel, col, ctrl);
        }
    }

    _applyHorizontalMovement(dt, input, vel, col, ctrl) {
        if (ctrl.isDashing || ctrl.isHit) {
            if (ctrl.isHit) vel.vx = 0;
            return;
        }

        const applyInput = !ctrl.hLock;
        ctrl.hLock = false;

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

    _applyVerticalMovement(dt, vel, col, ctrl, state) {
        if (!col.isGrounded && !ctrl.isDashing && !ctrl.isHit && !ctrl.isSpawning) {
            vel.vy += PLAYER_CONSTANTS.GRAVITY * dt;
        }

        if (state && state.currentState === 'cling') {
            vel.vy = Math.min(vel.vy, 30);
        }

        vel.vy = Math.min(vel.vy, PLAYER_CONSTANTS.MAX_FALL_SPEED);
    }

    _updateSurfaceEffects(dt, pos, vel, col, ctrl) {
        const onGroundAndMoving = col.isGrounded && Math.abs(vel.vx) > 1 && !ctrl.isDashing && !ctrl.isHit;
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