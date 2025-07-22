import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class CollisionSystem {
  constructor() {}

  update(dt, { entityManager, level }) {
    for (const trap of level.traps) {
        if (trap.type === 'fire_trap') {
            trap.playerIsOnTop = false;
        }
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

        pos.x += vel.vx * dt;
        this._handleTileHorizontalCollisions(pos, vel, col, level);

        pos.y += vel.vy * dt;
        this._handleTileVerticalCollisions(pos, vel, col, level, dt);
        
        this._handleSolidObjectCollisions(pos, vel, col, level, dt);

        pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));

        this._checkObjectInteractions(pos, vel, col, level, dt, entityId, entityManager);
    }
  }

  _handleTileHorizontalCollisions(pos, vel, col, level) {
    if (vel.vx === 0) { col.isAgainstWall = false; return; }
    const topTile = Math.floor(pos.y / GRID_CONSTANTS.TILE_SIZE);
    const bottomTile = Math.floor((pos.y + col.height - 1) / GRID_CONSTANTS.TILE_SIZE);
    const checkX = vel.vx > 0 ? pos.x + col.width : pos.x;
    const tileX = Math.floor(checkX / GRID_CONSTANTS.TILE_SIZE);

    for (let y = topTile; y <= bottomTile; y++) {
      const tile = level.getTileAt(tileX * GRID_CONSTANTS.TILE_SIZE, y * GRID_CONSTANTS.TILE_SIZE);
      if (tile && tile.solid) {
        pos.x = vel.vx > 0 ? tileX * GRID_CONSTANTS.TILE_SIZE - col.width : (tileX + 1) * GRID_CONSTANTS.TILE_SIZE;
        vel.vx = 0;
        col.isAgainstWall = !['dirt', 'sand', 'mud', 'ice'].includes(tile.type);
        return; 
      }
    }
    col.isAgainstWall = false;
  }

  _handleTileVerticalCollisions(pos, vel, col, level, dt) {
    const leftTile = Math.floor(pos.x / GRID_CONSTANTS.TILE_SIZE);
    const rightTile = Math.floor((pos.x + col.width - 1) / GRID_CONSTANTS.TILE_SIZE);
    
    if (vel.vy < 0) { // Upward
        const tileY = Math.floor(pos.y / GRID_CONSTANTS.TILE_SIZE);
        for (let x = leftTile; x <= rightTile; x++) {
            const tile = level.getTileAt(x * GRID_CONSTANTS.TILE_SIZE, tileY * GRID_CONSTANTS.TILE_SIZE);
            if (tile && tile.solid) {
                pos.y = (tileY + 1) * GRID_CONSTANTS.TILE_SIZE;
                vel.vy = 0;
                return;
            }
        }
    }

    const checkY = pos.y + col.height;
    const tileY = Math.floor(checkY / GRID_CONSTANTS.TILE_SIZE);
    
    col.isGrounded = false;

    for (let x = leftTile; x <= rightTile; x++) {
      const tile = level.getTileAt(x * GRID_CONSTANTS.TILE_SIZE, tileY * GRID_CONSTANTS.TILE_SIZE);
      if (tile && tile.solid && vel.vy >= 0) {
        const tileTop = tileY * GRID_CONSTANTS.TILE_SIZE;
        const playerBottom = pos.y + col.height;
        const prevPlayerBottom = playerBottom - vel.vy * dt;

        if (playerBottom >= tileTop && prevPlayerBottom <= tileTop + 1) {
            this._landOnSurface(pos, vel, col, tileTop, tile.interaction || tile.type);
            return;
        }
      }
    }
  }

  _handleSolidObjectCollisions(pos, vel, col, level, dt) {
    const allSolidObjects = level.traps.filter(t => t.solid);

    for(const obj of allSolidObjects) {
        const objLeft = obj.x - obj.width / 2;
        const objRight = obj.x + obj.width / 2;
        const objTop = obj.y - obj.height / 2;
        const objBottom = obj.y + obj.height / 2;

        const playerLeft = pos.x;
        const playerRight = pos.x + col.width;
        const playerTop = pos.y;
        const playerBottom = pos.y + col.height;

        if (playerRight < objLeft || playerLeft > objRight || playerBottom < objTop || playerTop > objBottom) {
            continue;
        }

        // Vertical Collision (Landing on top)
        if (vel.vy >= 0) {
             const prevPlayerBottom = playerBottom - vel.vy * dt;
             if (playerBottom >= objTop && prevPlayerBottom <= objTop + 1) {
                 this._landOnSurface(pos, vel, col, objTop, obj.type);
                 if (typeof obj.onLanded === 'function') {
                     obj.onLanded(eventBus);
                 }
                 continue; // Collision handled
             }
        }

        // Horizontal Collision
        if (playerBottom > objTop && playerTop < objBottom) {
            if (vel.vx > 0 && playerRight > objLeft && playerLeft < objLeft) {
                pos.x = objLeft - col.width;
                vel.vx = 0;
            } else if (vel.vx < 0 && playerLeft < objRight && playerRight > objRight) {
                pos.x = objRight;
                vel.vx = 0;
            }
        }
    }
  }

  _landOnSurface(pos, vel, col, surfaceTopY, surfaceType) {
    const landingVelocity = vel.vy;
    if (landingVelocity >= PLAYER_CONSTANTS.FALL_DAMAGE_MIN_VELOCITY) {
        const { FALL_DAMAGE_MIN_VELOCITY, FALL_DAMAGE_MAX_VELOCITY, FALL_DAMAGE_MIN_AMOUNT, FALL_DAMAGE_MAX_AMOUNT } = PLAYER_CONSTANTS;
        const clampedVelocity = Math.max(FALL_DAMAGE_MIN_VELOCITY, Math.min(landingVelocity, FALL_DAMAGE_MAX_VELOCITY));
        const progress = (clampedVelocity - FALL_DAMAGE_MIN_VELOCITY) / (FALL_DAMAGE_MAX_VELOCITY - FALL_DAMAGE_MIN_VELOCITY);
        const damage = Math.round(FALL_DAMAGE_MIN_AMOUNT + progress * (FALL_DAMAGE_MAX_AMOUNT - FALL_DAMAGE_MIN_AMOUNT));
        eventBus.publish('playerTookDamage', { amount: damage, source: 'fall' });
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
        // Refactored trap interaction logic 
        if (trap.type === 'trampoline') {
            // Trampoline requires a specific "landing on top" check.
            if (vel.vy > 0) { // Must be falling onto it.
                const playerBottom = pos.y + col.height;
                const trampTop = trap.y - trap.height / 2;
                const trampLeft = trap.x - trap.width / 2;
                const prevPlayerBottom = playerBottom - vel.vy * dt;

                if (pos.x + col.width > trampLeft && pos.x < trampLeft + trap.width) {
                    if (playerBottom >= trampTop && prevPlayerBottom <= trampTop + 1) {
                        trap.onCollision(player, eventBus);
                        // Use 'continue' to prevent other interactions in the same frame after bouncing.
                        // This fixes a bug where a return statement would exit the function entirely.
                        continue;
                    }
                }
            }
        } else if (trap.type === 'fan') {
            // A fan is a zone of influence. We just need to check if the player overlaps with its wind hitbox.
            // We use the trap's own 'hitbox' getter which correctly calculates the wind area.
            if (this._isCollidingWith(pos, col, trap)) {
                trap.onCollision(player, eventBus);
            }
        } else {
            // All other traps (like spikes, spiked balls) use a standard overlap check.
            if (this._isCollidingWith(pos, col, trap)) {
                trap.onCollision(player, eventBus);
            }
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

            // Publish events for knockback, sound, and camera shake
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