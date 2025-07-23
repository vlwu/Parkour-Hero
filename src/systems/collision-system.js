import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { SpatialGrid } from '../utils/spatial-grid.js';

export class CollisionSystem {
  constructor() {
    this.spatialGrid = null;
    this.currentLevel = null;
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

    level.traps.forEach(trap => {
        // Only add permanently solid traps to the static grid.
        // Falling platforms are handled dynamically.
        if (trap.solid && trap.type !== 'falling_platform') {
            const hitbox = trap.hitbox || {
                x: trap.x - trap.width / 2,
                y: trap.y - trap.height / 2,
                width: trap.width,
                height: trap.height,
            };
            this.spatialGrid.insert({
                ...hitbox,
                isOneWay: false,
                surfaceType: trap.type,
                onLanded: typeof trap.onLanded === 'function' ? trap.onLanded.bind(trap) : null,
                type: 'trap'
            });
        }
    });
  }

  update(dt, { entityManager, level }) {
    if (level !== this.currentLevel) {
        this._initializeGridForLevel(level);
    }

    const entities = entityManager.query([PositionComponent, VelocityComponent, CollisionComponent]);

    for (const entityId of entities) {
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const vel = entityManager.getComponent(entityId, VelocityComponent);
        const col = entityManager.getComponent(entityId, CollisionComponent);

        const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);
        if (playerCtrl && (playerCtrl.isSpawning || playerCtrl.isDespawning)) {
            continue;
        }

        if (pos.y > level.height + 50) {
            eventBus.publish('collisionEvent', { type: 'world_bottom', entityId, entityManager });
            continue;
        }

        // --- Get all potential colliders for this frame ---
        const queryBounds = { x: pos.x, y: pos.y, width: col.width, height: col.height };
        const staticColliders = this.spatialGrid.query(queryBounds);
        const dynamicColliders = level.traps
            .filter(trap => trap.type === 'falling_platform' && trap.solid)
            .map(trap => ({
                x: trap.x - trap.width / 2,
                y: trap.y - trap.height / 2,
                width: trap.width,
                height: trap.height,
                isOneWay: false,
                surfaceType: 'platform',
                onLanded: typeof trap.onLanded === 'function' ? trap.onLanded.bind(trap) : null,
            }));

        const allColliders = [...staticColliders, ...dynamicColliders];

        // --- Resolve Collisions ---
        pos.x += vel.vx * dt;
        this._resolveHorizontalCollisions(pos, vel, col, allColliders);

        pos.y += vel.vy * dt;
        this._resolveVerticalCollisions(pos, vel, col, dt, entityId, allColliders);

        pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));
        this._checkObjectInteractions(pos, vel, col, level, dt, entityId, entityManager);
    }
  }

  _resolveHorizontalCollisions(pos, vel, col, colliders) {
    if (vel.vx === 0) {
        col.isAgainstWall = false;
        return;
    }
    
    col.isAgainstWall = false;

    for (const collider of colliders) {
        if (collider.isOneWay) continue;

        if (pos.x < collider.x + collider.width && pos.x + col.width > collider.x &&
            pos.y < collider.y + collider.height && pos.y + col.height > collider.y) {
            if (vel.vx > 0) {
                pos.x = collider.x - col.width;
            } else {
                pos.x = collider.x + collider.width;
            }
            vel.vx = 0;
            col.isAgainstWall = !['sand', 'mud', 'ice'].includes(collider.surfaceType);
        }
    }
  }

  _resolveVerticalCollisions(pos, vel, col, dt, entityId, colliders) {
    col.isGrounded = false;

    for (const collider of colliders) {
        if (pos.x < collider.x + collider.width && pos.x + col.width > collider.x) {

            if (vel.vy >= 0) {
                const playerBottom = pos.y + col.height;
                const prevPlayerBottom = playerBottom - vel.vy * dt;

                if (playerBottom >= collider.y && prevPlayerBottom <= collider.y + 1) {
                    this._landOnSurface(pos, vel, col, collider.y, collider.surfaceType, entityId);
                    if (collider.onLanded) {
                        collider.onLanded(eventBus);
                    }
                    return; // Exit after first solid ground collision
                }
            }
            if (vel.vy < 0) {
                const playerTop = pos.y;
                if (!collider.isOneWay && playerTop < collider.y + collider.height && playerTop > collider.y) {
                    pos.y = collider.y + collider.height;
                    vel.vy = 0;
                }
            }
        }
    }
  }

  _landOnSurface(pos, vel, col, surfaceTopY, surfaceType, entityId) {
    const landingVelocity = vel.vy;
    if (landingVelocity >= PLAYER_CONSTANTS.FALL_DAMAGE_MIN_VELOCITY) {
        eventBus.publish('playerLandedHard', { entityId, landingVelocity });
    }

    pos.y = surfaceTopY - col.height;
    vel.vy = 0;
    col.isGrounded = true;
    col.groundType = surfaceType;
  }

  _isCollidingWith(pos, col, other) {
    const hitbox = other.hitbox || {
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
        // Only check non-solid traps here, as solid ones are handled above
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
    const trophyHitbox = {
        x: trophy.x - trophy.size / 2,
        y: (trophy.y - trophy.size / 2) + collisionOffset,
        width: trophy.size,
        height: trophy.size - collisionOffset
    };

    const playerLeft = pos.x;
    const playerRight = pos.x + col.width;
    const playerTop = pos.y;
    const playerBottom = pos.y + col.height;

    if (playerRight < trophyHitbox.x || playerLeft > trophyHitbox.x + trophyHitbox.width || playerBottom < trophyHitbox.y || playerTop > trophyHitbox.y + trophyHitbox.height) {
        return;
    }

    const prevPlayerBottom = playerBottom - vel.vy * dt;
    if (vel.vy >= 0 && playerBottom >= trophyHitbox.y && prevPlayerBottom <= trophyHitbox.y + 1) {
        if (!trophy.isAnimating) {
            trophy.isAnimating = true;


            eventBus.publish('playerKnockback', { entityId, entityManager, vx: 0, vy: -300 });
            eventBus.publish('playSound', { key: 'trophy_activated', volume: 0.9, channel: 'UI' });
            eventBus.publish('cameraShakeRequested', { intensity: 6, duration: 0.25 });
        }
        return;
    }

    if (playerBottom > trophyHitbox.y && playerTop < trophyHitbox.y + trophyHitbox.height) {
        if (vel.vx > 0 && playerRight > trophyHitbox.x && playerLeft < trophyHitbox.x) {
            pos.x = trophyHitbox.x - col.width;
            vel.vx = 0;
        } else if (vel.vx < 0 && playerLeft < trophyHitbox.x + trophyHitbox.width && playerRight > trophyHitbox.x + trophyHitbox.width) {
            pos.x = trophyHitbox.x + trophyHitbox.width;
            vel.vx = 0;
        }
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