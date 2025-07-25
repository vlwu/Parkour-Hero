import { PLAYER_CONSTANTS, GRID_CONSTANTS, TRAP_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { SpatialGrid } from '../utils/spatial-grid.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { KillableComponent } from '../components/KillableComponent.js';

export class CollisionSystem {
    constructor() {
        this.spatialGrid = null;
        this.currentLevel = null;
        this.dynamicGridObjects = [];
    }

    _initializeGridForLevel(level) {
        const cellSize = GRID_CONSTANTS.TILE_SIZE * 2;
        this.spatialGrid = new SpatialGrid(level.width, level.height, cellSize);
        this.currentLevel = level;


        for (let y = 0; y < level.gridHeight; y++) {
            for (let x = 0; x < level.gridWidth; x++) {
                const tile = level.tiles[y][x];
                if (tile && tile.solid) {
                    this.spatialGrid.insert({
                        x: x * GRID_CONSTANTS.TILE_SIZE,
                        y: y * GRID_CONSTANTS.TILE_SIZE,
                        width: GRID_CONSTANTS.TILE_SIZE,
                        height: GRID_CONSTANTS.TILE_SIZE,
                        isOneWay: tile.oneWay || false,
                        surfaceType: tile.interaction || tile.type,
                        type: 'tile'
                    });
                }
            }
        }
    }

    _updateGridWithDynamicObjects(entityManager, level) {

        this.spatialGrid.removeObjects(this.dynamicGridObjects);
        this.dynamicGridObjects = [];


        level.traps.forEach(trap => {
            if (trap.solid) {
                const hitbox = trap.hitbox || {
                    x: trap.x - trap.width / 2,
                    y: trap.y - trap.height / 2,
                    width: trap.width,
                    height: trap.height,
                };
                const gridObject = {
                    ...hitbox,
                    isOneWay: false,
                    surfaceType: trap.type === 'falling_platform' ? 'platform' : trap.type,
                    onLanded: typeof trap.onLanded === 'function' ? trap.onLanded.bind(trap) : null,
                    type: 'trap'
                };
                this.spatialGrid.insert(gridObject);
                this.dynamicGridObjects.push(gridObject);
            }
        });


        const dynamicEntities = entityManager.query([PositionComponent, CollisionComponent, DynamicColliderComponent]);
        for (const entityId of dynamicEntities) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const isEnemy = entityManager.hasComponent(entityId, EnemyComponent);

            const gridObject = {
                x: pos.x,
                y: pos.y,
                width: col.width,
                height: col.height,
                isOneWay: false,
                surfaceType: isEnemy ? 'enemy' : 'entity',
                type: 'entity',
                entityId: entityId
            };
            this.spatialGrid.insert(gridObject);
            this.dynamicGridObjects.push(gridObject);
        }
    }


    update(dt, {
        entityManager,
        level
    }) {
        if (level !== this.currentLevel) {
            this._initializeGridForLevel(level);
        }

        this._updateGridWithDynamicObjects(entityManager, level);

        const entities = entityManager.query([PositionComponent, VelocityComponent, CollisionComponent]);

        for (const entityId of entities) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);

            if (playerCtrl && (playerCtrl.isSpawning || playerCtrl.isDespawning)) {
                continue;
            }

            if (pos.y > level.height + 100) {
                eventBus.publish('collisionEvent', {
                    type: 'world_bottom',
                    entityId,
                    entityManager
                });
                continue;
            }

            const broadphaseBounds = {
                x: pos.x - Math.abs(vel.vx * dt),
                y: pos.y - Math.abs(vel.vy * dt),
                width: col.width + Math.abs(vel.vx * dt) * 2,
                height: col.height + Math.abs(vel.vy * dt) * 2,
            };

            const allColliders = this.spatialGrid.query(broadphaseBounds);

            this._handleHorizontalCollisions(pos, vel, col, allColliders, dt, entityId, entityManager);
            this._handleVerticalCollisions(pos, vel, col, allColliders, dt, entityId, entityManager);

            pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));

            if (pos.y < 0) {
                pos.y = 0;
                if (vel.vy < 0) {
                    vel.vy = 0;
                }
            }
            this._checkObjectInteractions(pos, vel, col, level, dt, entityId, entityManager);
        }
    }

    _isRectColliding(rectA, rectB) {
        return (
            rectA.x < rectB.x + rectB.width &&
            rectA.x + rectA.width > rectB.x &&
            rectA.y < rectB.y + rectB.height &&
            rectA.y + rectA.height > rectB.y
        );
    }

    _handleHorizontalCollisions(pos, vel, col, colliders, dt, entityId, entityManager) {
        pos.x += vel.vx * dt;
        col.isAgainstWall = false;
        const playerRect = {
            x: pos.x,
            y: pos.y,
            width: col.width,
            height: col.height
        };

        for (const collider of colliders) {
            if (collider.type === 'entity' && collider.entityId === entityId) continue;
            if (collider.isOneWay) continue;

            if (this._isRectColliding(playerRect, collider)) {
                const isPlayer = entityManager.hasComponent(entityId, PlayerControlledComponent);

                if (isPlayer && collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent)) {
                    const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                    const killable = entityManager.getComponent(collider.entityId, KillableComponent);

                    if (!enemy.isDead && (!killable || killable.dealsContactDamage)) {
                        const knockbackVx = (pos.x + col.width / 2) < (collider.x + collider.width / 2) ? -150 : 150;
                        eventBus.publish('collisionEvent', {
                            type: 'hazard',
                            entityId: entityId,
                            entityManager: entityManager,
                            damage: 20,
                            knockback: {
                                vx: knockbackVx,
                                vy: -150
                            }
                        });
                    }
                }

                if (vel.vx > 0) {
                    pos.x = collider.x - col.width;
                } else if (vel.vx < 0) {
                    pos.x = collider.x + collider.width;
                }
                vel.vx = 0;
                playerRect.x = pos.x;
                col.isAgainstWall = !['sand', 'mud', 'ice', 'platform', 'enemy'].includes(collider.surfaceType);
            }
        }
    }

    _handleVerticalCollisions(pos, vel, col, colliders, dt, entityId, entityManager) {
        pos.y += vel.vy * dt;
        col.isGrounded = false;
        const playerRect = {
            x: pos.x,
            y: pos.y,
            width: col.width,
            height: col.height
        };

        for (const collider of colliders) {
            if (collider.type === 'entity' && collider.entityId === entityId) continue;
            if (!this._isRectColliding(playerRect, collider)) {
                continue;
            }

            const isPlayer = entityManager.hasComponent(entityId, PlayerControlledComponent);

            if (vel.vy >= 0) {
                const prevPlayerBottom = (pos.y - vel.vy * dt) + col.height;
                const landingTolerance = 2;
                if (prevPlayerBottom <= collider.y + landingTolerance) {
                    if (isPlayer && collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent)) {
                        const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                        const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                        if (!enemy.isDead && killable && killable.stompable) {
                            eventBus.publish('enemyStomped', {
                                enemyId: collider.entityId,
                                stompBounceVelocity: killable.stompBounceVelocity
                            });
                            pos.y = collider.y - col.height;
                            vel.vy = 0;
                            return;
                        } else if (!enemy.isDead && (!killable || killable.dealsContactDamage)) {
                            eventBus.publish('collisionEvent', {
                                type: 'hazard',
                                entityId: entityId,
                                entityManager: entityManager,
                                damage: 20,
                                knockback: {
                                    vx: vel.vx > 0 ? 50 : -50,
                                    vy: -150
                                }
                            });
                        }
                    }

                    this._landOnSurface(pos, vel, col, collider.y, collider.surfaceType, entityId);
                    playerRect.y = pos.y;
                    if (collider.onLanded) {
                        collider.onLanded(eventBus);
                    }
                }
            } else if (vel.vy < 0) {
                if (!collider.isOneWay) {
                    if (isPlayer && collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent)) {
                        const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                        const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                        if (!enemy.isDead && (!killable || killable.dealsContactDamage)) {
                            eventBus.publish('collisionEvent', {
                                type: 'hazard',
                                entityId: entityId,
                                entityManager: entityManager,
                                damage: 20,
                                knockback: {
                                    vx: vel.vx > 0 ? 50 : -50,
                                    vy: 150
                                }
                            });
                        }
                    }
                    pos.y = collider.y + collider.height;
                    vel.vy = 0;
                    playerRect.y = pos.y;
                }
            }
        }
    }

    _landOnSurface(pos, vel, col, surfaceTopY, surfaceType, entityId) {
        const landingVelocity = vel.vy;
        if (landingVelocity >= PLAYER_CONSTANTS.FALL_DAMAGE_MIN_VELOCITY) {
            eventBus.publish('playerLandedHard', {
                entityId,
                landingVelocity
            });
        }
        pos.y = surfaceTopY - col.height;
        vel.vy = 0;
        col.isGrounded = true;
        col.groundType = surfaceType;
    }

    _isCollidingWith(pos, col, other) {
        const hitbox = other.damageHitbox || other.hitbox || {
            x: other.x - (other.width || other.size) / 2,
            y: other.y - (other.height || other.size) / 2,
            width: other.width || other.size,
            height: other.height || other.size
        };
        return (
            pos.x < hitbox.x + hitbox.width &&
            pos.x + col.width > hitbox.x &&
            pos.y < hitbox.y + hitbox.height &&
            pos.y + col.height > hitbox.y
        );
    }

    _checkObjectInteractions(pos, vel, col, level, dt, entityId, entityManager) {
        this._checkFruitCollisions(pos, col, level, entityId, entityManager);
        this._checkTrophyCollision(pos, col, level.trophy, entityId, entityManager, vel, dt);
        this.checkCheckpointCollisions(pos, col, level, entityId, entityManager);
        this._checkTrapInteractions(pos, vel, col, level, dt, entityId, entityManager);
    }

    _checkTrapInteractions(pos, vel, col, level, dt, entityId, entityManager) {
        const player = {
            pos,
            vel,
            col,
            entityId,
            entityManager,
            dt
        };
        for (const trap of level.traps) {
            if (!trap.solid && this._isCollidingWith(pos, col, trap)) {
                trap.onCollision(player, eventBus);
            }
        }
    }

    _checkFruitCollisions(pos, col, level, entityId, entityManager) {
        for (const fruit of level.getActiveFruits()) {
            if (this._isCollidingWith(pos, col, fruit)) {
                eventBus.publish('collisionEvent', {
                    type: 'fruit',
                    entityId,
                    target: fruit,
                    entityManager
                });
            }
        }
    }

    _checkTrophyCollision(pos, col, trophy, entityId, entityManager, vel, dt) {
        if (!trophy || trophy.inactive || trophy.acquired) return;
        const collisionOffset = 15;
        const trophyHitbox = {
            x: trophy.x - trophy.size / 2,
            y: (trophy.y - trophy.size / 2) + collisionOffset,
            width: trophy.size,
            height: trophy.size - collisionOffset
        };

        if (!this._isRectColliding({
                x: pos.x,
                y: pos.y,
                width: col.width,
                height: col.height
            }, trophyHitbox)) {
            return;
        }

        const prevPlayerBottom = (pos.y + col.height) - vel.vy * dt;
        if (vel.vy >= 0 && prevPlayerBottom <= trophyHitbox.y) {
            if (!trophy.isAnimating) {
                trophy.isAnimating = true;
                eventBus.publish('playerKnockback', {
                    entityId,
                    entityManager,
                    vx: 0,
                    vy: -300
                });
                eventBus.publish('playSound', {
                    key: 'trophy_activated',
                    volume: 0.9,
                    channel: 'UI'
                });
                eventBus.publish('cameraShakeRequested', {
                    intensity: 6,
                    duration: 0.25
                });
            }
            return;
        }

        if (vel.vx > 0) {
            pos.x = trophyHitbox.x - col.width;
            vel.vx = 0;
        } else if (vel.vx < 0) {
            pos.x = trophyHitbox.x + trophyHitbox.width;
            vel.vx = 0;
        }
    }

    checkCheckpointCollisions(pos, col, level, entityId, entityManager) {
        for (const cp of level.getInactiveCheckpoints()) {
            if (this._isCollidingWith(pos, col, cp)) {
                eventBus.publish('collisionEvent', {
                    type: 'checkpoint',
                    entityId,
                    target: cp,
                    entityManager
                });
            }
        }
    }
}