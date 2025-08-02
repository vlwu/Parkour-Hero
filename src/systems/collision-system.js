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
import { IdleState } from '../states/player/IdleState.js';
import { getTileProperties } from '../entities/tile-definitions.js';

export class CollisionSystem {
    constructor() {
        this.spatialGrid = null;
        this.currentLevel = null;
        this.trapGridCells = new Map();
    }

    _initializeGridForLevel(level) {
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

        level.traps.forEach(trap => {
            const isStatic = !trap.update.toString().includes('// DYNAMIC');
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
        });
    }

    _areSetsEqual(setA, setB) {
        if (setA.size !== setB.size) return false;
        for (const item of setA) {
            if (!setB.has(item)) return false;
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

            if (oldCells.size > 0) {
                this.spatialGrid.removeObjectFromCells(entityId, oldCells);
            }

            const isEnemy = entityManager.hasComponent(entityId, EnemyComponent);
            const gridObject = { ...entityRect, isOneWay: false, surfaceType: isEnemy ? 'enemy' : 'entity', type: 'entity', entityId: entityId };

            this.spatialGrid.insertObjectIntoCells(gridObject, newCells);
            dynCol._spatialGridCells = newCells;
        }


        level.traps.forEach(trap => {
            const isStatic = !trap.update.toString().includes('// DYNAMIC');
            if (!isStatic) {
                const oldCells = this.trapGridCells.get(trap.id);

                if (trap.solid) {

                    const hitbox = trap.hitbox;
                    const newCells = this.spatialGrid.getGridIndices(hitbox);

                    if (oldCells && this._areSetsEqual(oldCells, newCells)) {
                        return;
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
        });
    }


    update(dt, { entityManager, level }) {
        if (level !== this.currentLevel) {
            this._initializeGridForLevel(level);
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

            if (playerCtrl) {
                playerCtrl.previousGroundEntity = col.groundEntity;
            }
            col.groundEntity = null;

            if (playerCtrl && (playerCtrl.isSpawning || playerCtrl.isDespawning || playerCtrl.needsRespawn)) {
                continue;
            }

            if (pos.y > level.height + 100) {
                eventBus.publish('collisionEvent', { type: 'world_bottom', entityId, entityManager });
                continue;
            }

            pos.x += vel.vx * dt;
            col.isAgainstWall = false;

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
                    } else if (vel.vx < 0) {
                        pos.x = collider.x + collider.width + PUSH_BUFFER;
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


                    if (vel.vy > 0 && prevBodyBottom <= collider.y + 5 && !enemy.isDead && killable?.stompable) {
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
                    if (prevBodyBottom <= collider.y + 2) {
                        if (!collider.isOneWay || prevBodyBottom <= collider.y) {
                           validGroundColliders.push(collider);
                        }
                    }
                } else {
                    if (!collider.isOneWay) {
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
            this._checkObjectInteractions(pos, vel, col, level, dt, entityId, entityManager);

            if (playerCtrl) {
                this._handleMudInteraction(entityId, pos, col, playerCtrl, level, entityManager);
            }
        }
    }

    _handleMudInteraction(entityId, pos, col, playerCtrl, level, entityManager) {
        const vel = entityManager.getComponent(entityId, VelocityComponent);
        const checkRect = { x: pos.x, y: pos.y, width: col.width, height: col.height + 1 };
        const potentialColliders = this.spatialGrid.query(checkRect);
        let touchingMud = false;
        let highestMudY = -Infinity;

        for (const collider of potentialColliders) {
            if (collider.surfaceType === 'mud' && this._isRectColliding(checkRect, collider)) {
                touchingMud = true;
                if (collider.y > highestMudY) {
                    highestMudY = collider.y;
                }
            }
        }

        if (touchingMud) {
            if (vel.vy >= 0) {
                if (!playerCtrl.isInMud) {
                    playerCtrl.isInMud = true;
                    eventBus.publish('createParticles', {
                        x: pos.x + col.width / 2,
                        y: highestMudY,
                        type: 'mud_splash'
                    });
                    eventBus.publish('playSound', { key: 'mud_splat', volume: 0.8, channel: 'SFX' });
                }
                pos.y = highestMudY - col.height + playerCtrl.mudSinkAmount;
                vel.vy = 0;
                col.isGrounded = true;
                col.groundType = 'mud';
            }
        } else if (playerCtrl.isInMud) {
            playerCtrl.isInMud = false;
        }
    }

    removeDynamicEntity(entityId, entityManager) {
        const dynCol = entityManager.getComponent(entityId, DynamicColliderComponent);
        if (dynCol && dynCol._spatialGridCells) {
            this.spatialGrid.removeObjectFromCells(entityId, dynCol._spatialGridCells);
            dynCol._spatialGridCells.clear();
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

        if (playerCtrl && landingVelocity >= PLAYER_CONSTANTS.FALL_DAMAGE_MIN_VELOCITY && playerCtrl.fallDistance > PLAYER_CONSTANTS.HEIGHT && surfaceType !== 'mud') {
            eventBus.publish('playerLandedHard', { entityId, landingVelocity });
        }

        const PUSH_BUFFER = 0.01;
        pos.y = surfaceTopY - col.height - PUSH_BUFFER;
        vel.vy = 0;
        col.isGrounded = true;
        col.groundType = surfaceType;
        col.groundEntity = groundInstance;
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
        const player = { pos, vel, col, entityId, entityManager, dt };
        for (const trap of level.traps) {
            if (!trap.solid && this._isCollidingWith(pos, col, trap)) {
                trap.onCollision(player, eventBus);
            }
        }
    }

    _checkFruitCollisions(pos, col, level, entityId, entityManager) {
        for (const fruit of level.getActiveFruits()) {
            if (this._isCollidingWith(pos, col, fruit)) {
                eventBus.publish('collisionEvent', { type: 'fruit', entityId, target: fruit, entityManager });
            }
        }
    }

    _checkTrophyCollision(pos, col, trophy, entityId, entityManager, vel, dt) {
        if (!trophy || trophy.inactive || trophy.acquired) return;
        const collisionOffset = 15;
        const trophyHitbox = { x: trophy.x - trophy.size / 2, y: (trophy.y - trophy.size / 2) + collisionOffset, width: trophy.size, height: trophy.size - collisionOffset };

        if (!this._isRectColliding({ x: pos.x, y: pos.y, width: col.width, height: col.height }, trophyHitbox)) {
            return;
        }

        const prevPlayerBottom = (pos.y + col.height) - vel.vy * dt;
        if (vel.vy >= 0 && prevPlayerBottom <= trophyHitbox.y) {
            if (!trophy.isAnimating) {
                trophy.isAnimating = true;
                const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);
                if (playerCtrl) {
                    playerCtrl.inputLocked = true;
                }
                eventBus.publish('playerKnockback', { entityId, entityManager, vx: 0, vy: -300 });
                eventBus.publish('playSound', { key: 'trophy_activated', volume: 0.9, channel: 'UI' });
                eventBus.publish('cameraShakeRequested', { intensity: 6, duration: 0.25 });
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
                eventBus.publish('collisionEvent', { type: 'checkpoint', entityId, target: cp, entityManager });
            }
        }
    }
}