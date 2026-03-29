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
import { StateComponent } from '../components/StateComponent.js';
import { getTileProperties } from '../entities/tile-definitions.js';
import { TrapComponent } from '../components/TrapComponent.js';

export class CollisionSystem {
    constructor() {
        this.spatialGrid = null;
        this.currentLevel = null;
        this.trapGridCells = new Map();
        this._deltaVector = { dx: 0, dy: 0 };
    }

    _initializeGridForLevel(level, entityManager) {
        const cellSize = GRID_CONSTANTS.TILE_SIZE * 2;
        this.spatialGrid = new SpatialGrid(level.width, level.height, cellSize);
        this.currentLevel = level;
        this.trapGridCells.clear();

        for (let y = 0; y < level.gridHeight; y++) {
            for (let x = 0; x < level.gridWidth; x++) {
                const tileId = level.tiles[y][x];
                const properties = getTileProperties(tileId);

                if (properties && properties.solid) {
                    const collisionWidth = properties.collisionBox ? properties.collisionBox.width : GRID_CONSTANTS.TILE_SIZE;
                    const collisionHeight = properties.collisionBox ? properties.collisionBox.height : GRID_CONSTANTS.TILE_SIZE;

                    this.spatialGrid.insert({
                        x: x * GRID_CONSTANTS.TILE_SIZE,
                        y: y * GRID_CONSTANTS.TILE_SIZE,
                        width: collisionWidth,
                        height: collisionHeight,
                        isOneWay: properties.oneWay || false,
                        surfaceType: properties.interaction || properties.type,
                        type: 'tile'
                    });
                }
            }
        }

        const trapEntities = entityManager.query([TrapComponent]);
        for (const entityId of trapEntities) {
            const trap = entityManager.getComponent(entityId, TrapComponent).trap;
            const isStatic = !trap.isDynamic;
            if (trap.solid && isStatic) {
                const gridObject = {
                    ...(trap.hitbox),
                    instance: trap,
                    type: 'trap',
                    isOneWay: trap.oneway || false,
                    surfaceType: trap.surfaceType,
                    onLanded: typeof trap.onLanded === 'function' ? trap.onLanded.bind(trap) : null
                };
                this.spatialGrid.insert(gridObject);
            }
        }
    }

    _areArraysEqual(arrA, arrB) {
        if (arrA.length !== arrB.length) return false;
        // Arrays are generated in consistent layout order, so direct element comparison works
        for (let i = 0; i < arrA.length; i++) {
            if (arrA[i] !== arrB[i]) return false;
        }
        return true;
    }

    _updateDynamicObjectsInGrid(entityManager, level) {
        const dynamicEntities = entityManager.query([PositionComponent, CollisionComponent, DynamicColliderComponent]);
        for (const entityId of dynamicEntities) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const dynCol = entityManager.getComponent(entityId, DynamicColliderComponent);
            const entityRect = { x: pos.x, y: pos.y, width: col.width, height: col.height };
            const newCells = this.spatialGrid.getGridIndices(entityRect);
            const oldCells = dynCol._spatialGridCells;

            if (oldCells.length > 0) {
                this.spatialGrid.removeObjectFromCells(entityId, oldCells);
            }

            const isEnemy = entityManager.hasComponent(entityId, EnemyComponent);
            const gridObject = { ...entityRect, isOneWay: false, surfaceType: isEnemy ? 'enemy' : 'entity', type: 'entity', entityId: entityId };

            this.spatialGrid.insertObjectIntoCells(gridObject, newCells);
            dynCol._spatialGridCells = newCells;
        }

        const trapEntities = entityManager.query([TrapComponent]);
        for (const entityId of trapEntities) {
            const trap = entityManager.getComponent(entityId, TrapComponent).trap;
            const isStatic = !trap.isDynamic;
            if (!isStatic) {
                const oldCells = this.trapGridCells.get(trap.id);

                if (trap.solid) {
                    const hitbox = trap.hitbox;
                    const newCells = this.spatialGrid.getGridIndices(hitbox);

                    if (oldCells && this._areArraysEqual(oldCells, newCells)) {
                        continue;
                    }

                    const gridObject = { ...(hitbox), instance: trap, id: trap.id, isOneWay: trap.oneway || false, surfaceType: trap.surfaceType || trap.type, onLanded: typeof trap.onLanded === 'function' ? trap.onLanded.bind(trap) : null, type: 'trap' };

                    if (oldCells) {
                        this.spatialGrid.removeObjectFromCells(trap.id, oldCells);
                    }
                    this.spatialGrid.insertObjectIntoCells(gridObject, newCells);
                    this.trapGridCells.set(trap.id, newCells);
                } else {
                    if (oldCells) {
                        this.spatialGrid.removeObjectFromCells(trap.id, oldCells);
                        this.trapGridCells.delete(trap.id);
                    }
                }
            }
        }
    }


    update(dt, { entityManager, level, gameState }) {
        if (level !== this.currentLevel) {
            this._initializeGridForLevel(level, entityManager);
        }
        this._updateDynamicObjectsInGrid(entityManager, level);

        const entities = entityManager.query([PositionComponent, VelocityComponent, CollisionComponent]);

        const entityRect = { x: 0, y: 0, width: 0, height: 0 };
        const queryBoxH = { x: 0, y: 0, width: 0, height: 0 };
        const queryBoxV = { x: 0, y: 0, width: 0, height: 0 };
        const groundProbe = { x: 0, y: 0, width: 0, height: 0 };

        for (const entityId of entities) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);

            col.groundEntity = null;

            if (playerCtrl && (playerCtrl.isSpawning || playerCtrl.isDespawning || playerCtrl.needsRespawn)) {
                continue;
            }

            if (pos.y > level.height) {
                eventBus.publish('collisionEvent', { type: 'world_bottom', entityId, entityManager });
                continue;
            }

            pos.x += vel.vx * dt;
            col.isAgainstWall = false;
            col.wallDirection = null;

            entityRect.x = pos.x;
            entityRect.y = pos.y;
            entityRect.width = col.width;
            entityRect.height = col.height;

            const oldX = pos.x - vel.vx * dt;
            queryBoxH.x = Math.min(pos.x, oldX);
            queryBoxH.y = pos.y;
            queryBoxH.width = col.width + Math.abs(vel.vx * dt);
            queryBoxH.height = col.height;

            const potentialCollidersH = this.spatialGrid.query(queryBoxH);

            for (const collider of potentialCollidersH) {
                if (collider.type === 'entity' && collider.entityId === entityId) continue;

                if (this._isRectColliding(entityRect, collider)) {
                    const isPlayer = !!playerCtrl;
                    const isEnemyCollider = collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent);

                    if (isPlayer && isEnemyCollider) {
                        const playerCtrlCheck = entityManager.getComponent(entityId, PlayerControlledComponent);
                        if (playerCtrlCheck && playerCtrlCheck.isDashing) {
                            continue;
                        }

                        const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                        const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                        if (!enemy.isDead && (!killable || killable.dealsContactDamage)) {
                            let damageAmount = 1000;
                            if (killable) {
                                if (typeof killable.contactDamage === 'function') {
                                    damageAmount = killable.contactDamage(collider.entityId, entityManager);
                                } else {
                                    damageAmount = killable.contactDamage;
                                }
                            }
                            eventBus.publish('playerTookDamage', { amount: damageAmount, source: 'enemy_contact' });
                            return;
                        }
                        continue;
                    }

                    if (collider.type === 'entity' && !isPlayer) {
                        continue;
                    }

                    if (collider.isOneWay) {
                        continue;
                    }

                    const PUSH_BUFFER = 0.01;
                    if (vel.vx > 0) {
                        pos.x = collider.x - col.width - PUSH_BUFFER;
                        col.wallDirection = 'right';
                    } else if (vel.vx < 0) {
                        pos.x = collider.x + collider.width + PUSH_BUFFER;
                        col.wallDirection = 'left';
                    }
                    vel.vx = 0;
                    entityRect.x = pos.x;

                    if (!collider.isOneWay) {
                        col.isAgainstWall = !['sand', 'mud', 'ice', 'platform'].includes(collider.surfaceType);
                    }
                }
            }

            pos.y += vel.vy * dt;
            col.isGrounded = false;
            col.hitCeiling = false;

            entityRect.x = pos.x;
            entityRect.y = pos.y;

            const oldY = pos.y - vel.vy * dt;
            queryBoxV.x = pos.x;
            queryBoxV.y = Math.min(pos.y, oldY);
            queryBoxV.width = col.width;
            queryBoxV.height = col.height + Math.abs(vel.vy * dt);

            const potentialCollidersV = this.spatialGrid.query(queryBoxV);
            const validGroundColliders = [];

            for (const collider of potentialCollidersV) {
                if (collider.type === 'entity' && collider.entityId === entityId) continue;
                if (!this._isRectColliding(entityRect, collider)) continue;

                const isPlayer = !!playerCtrl;
                const isEnemyCollider = collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent);

                if (isPlayer && isEnemyCollider) {
                    const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                    const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                    const prevBodyBottom = (pos.y - vel.vy * dt) + col.height;

                    const isPacifist = gameState?.equippedCosmetics?.mutator === 'pacifist_mutator';

                    if (!isPacifist && vel.vy > 0 && prevBodyBottom <= collider.y + 5 && !enemy.isDead && killable?.stompable) {
                        eventBus.publish('enemyStomped', { enemyId: collider.entityId, stompBounceVelocity: killable.stompBounceVelocity });
                        pos.y = collider.y - col.height;
                        vel.vy = 0;
                        continue;
                    }

                    const playerCtrlCheck = entityManager.getComponent(entityId, PlayerControlledComponent);
                    if (playerCtrlCheck && playerCtrlCheck.isDashing) {
                        continue;
                    }

                    if (!enemy.isDead && (!killable || killable.dealsContactDamage)) {
                        let damageAmount = 1000;
                        if (killable) {
                            if (typeof killable.contactDamage === 'function') {
                                damageAmount = killable.contactDamage(collider.entityId, entityManager);
                            } else {
                                damageAmount = killable.contactDamage;
                            }
                        }
                        eventBus.publish('playerTookDamage', { amount: damageAmount, source: 'enemy_contact' });
                        return;
                    }
                    continue;
                }

                if (collider.type === 'entity') {
                    continue;
                }

                if (vel.vy >= 0) {
                    const prevBodyBottom = (pos.y - vel.vy * dt) + col.height;
                    const wasOnThisPlatform = playerCtrl && playerCtrl.previousGroundEntity === collider.instance;

                    let canLand = false;
                    if (wasOnThisPlatform) {
                        canLand = true;
                    } else {
                        if (prevBodyBottom <= collider.y + 2) {
                            if (!collider.isOneWay || prevBodyBottom <= collider.y) {
                                canLand = true;
                            }
                        }
                    }

                    if (canLand) {
                        validGroundColliders.push(collider);
                    }
                } else {
                    const tileAboveIsSolid = collider.isOneWay && level.isSolidAt(collider.x + collider.width / 2, collider.y - 1, true);

                    if (!collider.isOneWay || tileAboveIsSolid) {
                        const prevBodyTop = (pos.y - vel.vy * dt);
                        const prevBodyXCenter = (pos.x - vel.vx * dt) + col.width / 2;
                        const colliderXStart = collider.x;
                        const colliderXEnd = collider.x + collider.width;

                        if (prevBodyTop >= collider.y + collider.height &&
                            prevBodyXCenter > colliderXStart &&
                            prevBodyXCenter < colliderXEnd) {
                            const PUSH_BUFFER = 0.01;
                            pos.y = collider.y + collider.height + PUSH_BUFFER;
                            vel.vy = 0;
                            entityRect.y = pos.y;
                            col.hitCeiling = true;
                        }
                    }
                }
            }

            if (validGroundColliders.length > 0) {
                const highestGround = validGroundColliders.reduce((prev, current) => (prev.y < current.y ? prev : current));
                this._landOnSurface(pos, vel, col, highestGround.y, highestGround.surfaceType, highestGround.instance, entityId, entityManager);
                entityRect.y = pos.y;
            } else if (col.isGrounded && col.groundEntity && typeof col.groundEntity.getMovementDelta === 'function') {
                col.groundEntity.getMovementDelta(this._deltaVector);
                if (this._deltaVector.dy < 0) {
                    const platformTop = col.groundEntity.hitbox.y;
                    const playerBottom = pos.y + col.height;
                    if (playerBottom > platformTop) {
                        pos.y = platformTop - col.height;
                        entityRect.y = pos.y;
                    }
                }
            } else if (col.isGrounded && col.groundEntity && col.groundEntity.isDynamic) {
                const platformTop = col.groundEntity.hitbox.y;
                const playerBottom = pos.y + col.height;
                const tolerance = 5;

                if (Math.abs(playerBottom - platformTop) <= tolerance) {
                    pos.y = platformTop - col.height;
                    entityRect.y = pos.y;
                }
            }

            if (!col.isGrounded && vel.vy >= 0) {
                groundProbe.x = pos.x;
                groundProbe.y = pos.y + col.height;
                groundProbe.width = col.width;
                groundProbe.height = 1;

                const potentialGround = this.spatialGrid.query(groundProbe);

                for (const ground of potentialGround) {
                    if (ground.type === 'entity' && ground.entityId === entityId) continue;
                    if (ground.type === 'entity') continue;

                    if (this._isRectColliding(groundProbe, ground)) {
                        col.isGrounded = true;
                        col.groundType = ground.surfaceType;
                        col.groundEntity = ground.instance;
                        break;
                    }
                }

                if (!col.isGrounded) {
                    const trapEntities = entityManager.query([TrapComponent]);
                    for (const trapId of trapEntities) {
                        const trap = entityManager.getComponent(trapId, TrapComponent).trap;
                        if (trap.isDynamic && trap.solid && typeof trap.hitbox === 'object') {
                            const platformTop = trap.hitbox.y;
                            const playerBottom = pos.y + col.height;
                            const tolerance = 5;

                            if (Math.abs(playerBottom - platformTop) <= tolerance &&
                                pos.x < trap.hitbox.x + trap.hitbox.width &&
                                pos.x + col.width > trap.hitbox.x) {
                                col.isGrounded = true;
                                col.groundType = trap.surfaceType || 'platform';
                                col.groundEntity = trap;
                                break;
                            }
                        }
                    }
                }
            } else if (col.isGrounded && col.groundEntity && typeof col.groundEntity.getMovementDelta === 'function') {
                col.groundEntity.getMovementDelta(this._deltaVector);
                if (this._deltaVector.dy !== 0) {
                    const platformTop = col.groundEntity.hitbox.y;
                    const playerBottom = pos.y + col.height;
                    const tolerance = 2;

                    if (Math.abs(playerBottom - platformTop) <= tolerance) {
                        pos.y = platformTop - col.height;
                    }
                }
            } else if (col.isGrounded && col.groundEntity && col.groundEntity.isDynamic) {
                const platformTop = col.groundEntity.hitbox.y;
                const playerBottom = pos.y + col.height;
                const tolerance = 5;

                if (Math.abs(playerBottom - platformTop) <= tolerance) {
                    pos.y = platformTop - col.height;
                }
            }

            if (playerCtrl && col.isGrounded && col.groundEntity && col.groundEntity !== playerCtrl.previousGroundEntity) {
                if (typeof col.groundEntity.onLanded === 'function') {
                    col.groundEntity.onLanded(eventBus);
                }
            }

            pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));
            if (pos.y < 0) {
                pos.y = 0;
                if (vel.vy < 0) vel.vy = 0;
            }
        }
    }

    removeDynamicEntity(entityId, entityManager) {
        const dynCol = entityManager.getComponent(entityId, DynamicColliderComponent);
        if (dynCol && dynCol._spatialGridCells) {
            this.spatialGrid.removeObjectFromCells(entityId, dynCol._spatialGridCells);
            dynCol._spatialGridCells.length = 0;
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

    _landOnSurface(pos, vel, col, surfaceTopY, surfaceType, groundInstance, entityId, entityManager) {
        const landingVelocity = vel.vy;
        const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);

        if (playerCtrl && landingVelocity >= PLAYER_CONSTANTS.FALL_DAMAGE_MIN_VELOCITY && playerCtrl.fallDistance > PLAYER_CONSTANTS.SPRITE_HEIGHT && surfaceType !== 'mud') {
            eventBus.publish('playerLandedHard', { entityId, landingVelocity });
        }

        const PUSH_BUFFER = 0.01;
        pos.y = surfaceTopY - col.height - PUSH_BUFFER;
        vel.vy = 0;
        col.isGrounded = true;
        col.groundType = surfaceType;
        col.groundEntity = groundInstance;
    }
}