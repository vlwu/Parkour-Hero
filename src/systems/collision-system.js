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
import { PreviousPositionComponent } from '../components/PreviousPositionComponent.js';

export class CollisionSystem {
    constructor() {
        this.spatialGrid = null;
        this.currentLevel = null;
        this.dynamicGridObjects = new Map();
    }

    _initializeGridForLevel(level) {
        const cellSize = GRID_CONSTANTS.TILE_SIZE * 2;
        this.spatialGrid = new SpatialGrid(level.width, level.height, cellSize);
        this.currentLevel = level;
        this.dynamicGridObjects.clear();


        for (let y = 0; y < level.gridHeight; y++) {
            for (let x = 0; x < level.gridWidth; x++) {
                const tile = level.tiles[y][x];
                if (tile && tile.solid) {
                    const collisionWidth = tile.collisionBox ? tile.collisionBox.width : GRID_CONSTANTS.TILE_SIZE;
                    const collisionHeight = tile.collisionBox ? tile.collisionBox.height : GRID_CONSTANTS.TILE_SIZE;

                    this.spatialGrid.insert({
                        x: x * GRID_CONSTANTS.TILE_SIZE,
                        y: y * GRID_CONSTANTS.TILE_SIZE,
                        width: collisionWidth,
                        height: collisionHeight,
                        isOneWay: tile.oneWay || false,
                        surfaceType: tile.interaction || tile.type,
                        type: 'tile'
                    });
                }
            }
        }

        level.staticPlatforms.forEach(platform => {
            const hitbox = platform.hitbox;
            this.spatialGrid.insert({
                ...hitbox,
                isOneWay: platform.oneway,
                surfaceType: platform.surfaceType,
                type: 'static_platform'
            });
        });
    }

    _updateGridWithDynamicObjects(entityManager, level) {
        const toRemove = [];
        this.dynamicGridObjects.forEach((gridObject, id) => {
            if (gridObject.type === 'trap' || !entityManager.entities.has(id)) {
                toRemove.push(id);
            }
        });

        toRemove.forEach(id => {
            const gridObject = this.dynamicGridObjects.get(id);
            if (gridObject) {
                this.spatialGrid.removeObject(gridObject);
            }
            this.dynamicGridObjects.delete(id);
        });

        level.traps.forEach(trap => {
            if (trap.solid && !this.dynamicGridObjects.has(trap.id)) {
                const hitbox = trap.hitbox || {
                    x: trap.x - trap.width / 2, y: trap.y - trap.height / 2,
                    width: trap.width, height: trap.height,
                };
                const gridObject = {
                    ...hitbox,
                    isOneWay: trap.oneway || false,
                    surfaceType: trap.surfaceType || (trap.type === 'falling_platform' ? 'platform' : trap.type),
                    onLanded: typeof trap.onLanded === 'function' ? trap.onLanded.bind(trap) : null,
                    type: 'trap'
                };
                this.spatialGrid.insert(gridObject);
                this.dynamicGridObjects.set(trap.id, gridObject);
            }
        });

        const dynamicEntities = entityManager.query([PositionComponent, PreviousPositionComponent, CollisionComponent, DynamicColliderComponent]);
        for (const entityId of dynamicEntities) {
            // Removed incorrect optimization. All dynamic entities must have their grid position
            // updated every frame to ensure the collision grid is always accurate.
            if (this.dynamicGridObjects.has(entityId)) {
                this.spatialGrid.removeObject(this.dynamicGridObjects.get(entityId));
            }

            const pos = entityManager.getComponent(entityId, PositionComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const isEnemy = entityManager.hasComponent(entityId, EnemyComponent);
            const gridObject = {
                x: pos.x, y: pos.y, width: col.width, height: col.height,
                isOneWay: false,
                surfaceType: isEnemy ? 'enemy' : 'entity', type: 'entity', entityId: entityId
            };
            this.spatialGrid.insert(gridObject);
            this.dynamicGridObjects.set(entityId, gridObject);
        }
    }

    update(dt, { entityManager, level }) {
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

            if (playerCtrl && (playerCtrl.isSpawning || playerCtrl.isDespawning || playerCtrl.needsRespawn)) {
                continue;
            }

            if (pos.y > level.height + 100) {
                eventBus.publish('collisionEvent', { type: 'world_bottom', entityId, entityManager });
                continue;
            }

            pos.x += vel.vx * dt;
            col.isAgainstWall = false;
            let entityRect = { x: pos.x, y: pos.y, width: col.width, height: col.height };

            const queryBoxH = { x: vel.vx > 0 ? pos.x : pos.x + vel.vx * dt, y: pos.y, width: col.width + Math.abs(vel.vx * dt), height: col.height };
            const potentialCollidersH = this.spatialGrid.query(queryBoxH);

            for (const collider of potentialCollidersH) {
                if (collider.type === 'entity' && collider.entityId === entityId) continue;
                if (collider.isOneWay) continue;

                if (this._isRectColliding(entityRect, collider)) {
                    const isPlayer = !!playerCtrl;
                    const isEnemyCollider = collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent);

                    if (isPlayer && isEnemyCollider && playerCtrl.isDashing) continue;

                    const penetration = (vel.vx > 0)
                        ? (entityRect.x + entityRect.width) - collider.x
                        : (collider.x + collider.width) - entityRect.x;
                    pos.x -= (vel.vx > 0) ? (penetration + 0.01) : -(penetration + 0.01);
                    vel.vx = 0;
                    entityRect.x = pos.x;

                    if (collider.type !== 'entity') {
                        col.isAgainstWall = !['sand', 'mud', 'ice', 'platform'].includes(collider.surfaceType);
                    }

                    if (isPlayer && isEnemyCollider) {
                        const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                        const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                        if (!enemy.isDead && killable && killable.dealsContactDamage) {
                            eventBus.publish('playerTookDamage', { amount: killable.contactDamage, source: 'enemy_contact' });
                            return;
                        }
                    }
                }
            }

            pos.y += vel.vy * dt;
            col.isGrounded = false;
            entityRect = { x: pos.x, y: pos.y, width: col.width, height: col.height };

            const queryBoxV = { x: pos.x, y: vel.vy > 0 ? pos.y : pos.y + vel.vy * dt, width: col.width, height: col.height + Math.abs(vel.vy * dt) };
            const potentialCollidersV = this.spatialGrid.query(queryBoxV);

            let stompedEnemy = false;
            if (playerCtrl && vel.vy >= 0) {
                const prevBodyBottom = (pos.y - vel.vy * dt) + col.height;
                for (const collider of potentialCollidersV) {
                    const isEnemy = collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent);
                    if (isEnemy && this._isRectColliding(entityRect, collider)) {
                        const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                        const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                        if (!enemy.isDead && killable?.stompable && prevBodyBottom <= collider.y + 5) {
                            eventBus.publish('enemyStomped', { enemyId: collider.entityId, stompBounceVelocity: killable.stompBounceVelocity });
                            pos.y = collider.y - col.height;
                            vel.vy = 0;
                            stompedEnemy = true;
                            col.isGrounded = true;
                            break;
                        }
                    }
                }
            }
            if (stompedEnemy) {
                 this._checkObjectInteractions(pos, vel, col, level, dt, entityId, entityManager);
                 continue;
            }

            let highestGroundCollider = null;

            for (const collider of potentialCollidersV) {
                if (collider.type === 'entity' && collider.entityId === entityId) continue;
                if (!this._isRectColliding(entityRect, collider)) continue;

                if (vel.vy >= 0) {
                    const prevBodyBottom = (pos.y - vel.vy * dt) + col.height;
                    if (prevBodyBottom <= collider.y + 2 && (!collider.isOneWay || prevBodyBottom <= collider.y)) {
                        if (highestGroundCollider === null || collider.y < highestGroundCollider.y) {
                            highestGroundCollider = collider;
                        }
                    }
                } else {
                    if (!collider.isOneWay) {
                        const PUSH_BUFFER = 0.01;
                        pos.y = collider.y + collider.height + PUSH_BUFFER;
                        vel.vy = 0;
                        entityRect.y = pos.y;
                    }
                }
            }
            
            if (highestGroundCollider) {
                this._landOnSurface(pos, vel, col, highestGroundCollider.y, highestGroundCollider.surfaceType, entityId);
                if (highestGroundCollider.onLanded) {
                    highestGroundCollider.onLanded(eventBus);
                }
            }

            // Re-introduce a more robust ground check "safety net" to prevent state jittering.
            // This checks a slightly larger area below the player.
            if (!col.isGrounded && vel.vy >= 0) {
                const groundProbe = {
                    x: pos.x,
                    y: pos.y + col.height,
                    width: col.width,
                    height: 2 // Increased height from 1 to 2 for more stable ground detection.
                };

                const potentialGround = this.spatialGrid.query(groundProbe);

                for (const ground of potentialGround) {
                    if (ground.type === 'entity' && ground.entityId === entityId) continue;
                    if (ground.type === 'entity') continue;

                    if (this._isRectColliding(groundProbe, ground)) {
                         if (!ground.isOneWay) {
                            this._landOnSurface(pos, vel, col, ground.y, ground.surfaceType, entityId);
                            if (vel.vy > 0) vel.vy = 0;
                            break;
                         } else if (ground.isOneWay && pos.y + col.height <= ground.y + 2) {
                            this._landOnSurface(pos, vel, col, ground.y, ground.surfaceType, entityId);
                            if (vel.vy > 0) vel.vy = 0;
                            break;
                         }
                    }
                }
            }

            pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));
            if (pos.y < 0) {
                pos.y = 0;
                if (vel.vy < 0) vel.vy = 0;
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