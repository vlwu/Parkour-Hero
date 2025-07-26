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

            // --- REVISED COLLISION LOGIC ---
            // We resolve movement and collisions on each axis separately to prevent bugs.

            // 1. Horizontal Movement and Collision
            pos.x += vel.vx * dt;
            col.isAgainstWall = false;
            let entityRect = { x: pos.x, y: pos.y, width: col.width, height: col.height };

            // Use a slightly larger query box to catch colliders at the edge of movement
            const queryBoxH = { x: vel.vx > 0 ? pos.x : pos.x + vel.vx * dt, y: pos.y, width: col.width + Math.abs(vel.vx * dt), height: col.height };
            const potentialCollidersH = this.spatialGrid.query(queryBoxH);

            for (const collider of potentialCollidersH) {
                if (collider.type === 'entity' && collider.entityId === entityId) continue;
                if (collider.isOneWay) continue;

                if (this._isRectColliding(entityRect, collider)) {
                    const isPlayer = !!playerCtrl;
                    const isEnemyCollider = collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent);

                    // Handle player-enemy specific logic.
                    if (isPlayer && isEnemyCollider) {
                        const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                        const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                        if (!enemy.isDead && (!killable || killable.dealsContactDamage)) {
                            eventBus.publish('playerTookDamage', { amount: 1000, source: 'enemy_contact' });
                            return; // Stop processing for this player.
                        }
                        // Player passes through non-damaging enemy.
                        continue;
                    }
                    
                    // If the current entity is an enemy and it hits the player, let it pass through.
                    // Damage is only initiated by the player's collision check.
                    if (collider.type === 'entity') {
                        continue;
                    }

                    // Physics response for solid tiles and traps
                    if (vel.vx > 0) { // Moving right
                        pos.x = collider.x - col.width;
                    } else if (vel.vx < 0) { // Moving left
                        pos.x = collider.x + collider.width;
                    }
                    vel.vx = 0;
                    entityRect.x = pos.x;
                    col.isAgainstWall = !['sand', 'mud', 'ice', 'platform'].includes(collider.surfaceType);
                }
            }

            // 2. Vertical Movement and Collision
            pos.y += vel.vy * dt;
            col.isGrounded = false;
            entityRect = { x: pos.x, y: pos.y, width: col.width, height: col.height };
            
            const queryBoxV = { x: pos.x, y: vel.vy > 0 ? pos.y : pos.y + vel.vy * dt, width: col.width, height: col.height + Math.abs(vel.vy * dt) };
            const potentialCollidersV = this.spatialGrid.query(queryBoxV);
            
            for (const collider of potentialCollidersV) {
                if (collider.type === 'entity' && collider.entityId === entityId) continue;
                if (!this._isRectColliding(entityRect, collider)) continue;

                const isPlayer = !!playerCtrl;
                const isEnemyCollider = collider.type === 'entity' && entityManager.hasComponent(collider.entityId, EnemyComponent);

                // Handle player-enemy specific logic.
                if (isPlayer && isEnemyCollider) {
                    const enemy = entityManager.getComponent(collider.entityId, EnemyComponent);
                    const killable = entityManager.getComponent(collider.entityId, KillableComponent);
                    const prevBodyBottom = (pos.y - vel.vy * dt) + col.height;

                    // Stomp Condition: Player must be moving down.
                    if (vel.vy > 0 && prevBodyBottom <= collider.y + 2 && !enemy.isDead && killable?.stompable) {
                        eventBus.publish('enemyStomped', { enemyId: collider.entityId, stompBounceVelocity: killable.stompBounceVelocity });
                        pos.y = collider.y - col.height;
                        vel.vy = 0;
                        continue; 
                    }
                    
                    // Damage Condition for any other contact.
                    if (!enemy.isDead && (!killable || killable.dealsContactDamage)) {
                        eventBus.publish('playerDied');
                        return;
                    }

                    // If neither stomp nor damage, pass through.
                    continue;
                }

                if (collider.type === 'entity') {
                    continue;
                }
                
                // Physics response for solid tiles and traps
                if (vel.vy >= 0) { // Moving Down
                    const prevBodyBottom = (pos.y - vel.vy * dt) + col.height;
                    if (prevBodyBottom <= collider.y + 2) {
                        if (!collider.isOneWay || prevBodyBottom <= collider.y) {
                           this._landOnSurface(pos, vel, col, collider.y, collider.surfaceType, entityId);
                           entityRect.y = pos.y;
                           if (collider.onLanded) {
                               collider.onLanded(eventBus);
                           }
                        }
                    }
                } else { // Moving Up
                    if (!collider.isOneWay) {
                        pos.y = collider.y + collider.height;
                        vel.vy = 0;
                        entityRect.y = pos.y;
                    }
                }
            }

            // Ground Stickiness / Probe
            if (!col.isGrounded && vel.vy >= 0) {
                const groundProbe = {
                    x: pos.x,
                    y: pos.y + col.height,
                    width: col.width,
                    height: 1 
                };
                const potentialGround = this.spatialGrid.query(groundProbe);

                for (const ground of potentialGround) {
                    if (ground.type === 'entity' && ground.entityId === entityId) continue;
                    
                    // --- BUG FIX START: Prevent probe from landing on entities ---
                    // The ground probe should only "stick" to level geometry (tiles, solid traps), not other entities.
                    if (ground.type === 'entity') {
                        continue;
                    }
                    // --- BUG FIX END ---

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

            // 3. Final position clamping and object interactions
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