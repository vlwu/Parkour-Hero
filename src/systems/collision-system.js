import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class CollisionSystem {
  constructor() {}

  update(dt, { entityManager, level }) {
    for (const trap of level.fireTraps) {
        trap.playerIsOnTop = false;
    }
      
    const entities = entityManager.query([PositionComponent, VelocityComponent, CollisionComponent]);
    
    for (const entityId of entities) {
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const vel = entityManager.getComponent(entityId, VelocityComponent);
        const col = entityManager.getComponent(entityId, CollisionComponent);

        if (pos.y > level.height + 50) {
            // MODIFIED: Publish a specific event for boundary collisions.
            eventBus.publish('worldBoundaryCollision', { type: 'world_bottom', entityId, entityManager });
            continue; 
        }

        // --- PHASE 1: Tile Grid Collision ---
        pos.x += vel.vx * dt;
        this._handleTileHorizontalCollisions(pos, vel, col, level);

        pos.y += vel.vy * dt;
        this._handleTileVerticalCollisions(pos, vel, col, level, dt);
        
        // --- PHASE 2: Solid Object Collision ---
        this._handleSolidObjectCollisions(pos, vel, col, level);

        // Clamp position to level bounds
        pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));

        // --- PHASE 3: Interaction and Hazard Collision ---
        this._checkDynamicObjectInteractions(pos, vel, col, level, dt, entityId, entityManager);
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

        if (playerBottom >= tileTop && (playerBottom - vel.vy * dt) <= tileTop + 1) {
            this._landOnSurface(pos, vel, col, tileTop, tile.interaction || tile.type);
            return;
        }
      }
    }
  }

  _handleSolidObjectCollisions(pos, vel, col, level) {
    const allSolidObjects = level.fireTraps.filter(t => t.solid);

    for(const obj of allSolidObjects) {
        const objLeft = obj.x - obj.width / 2;
        const objRight = obj.x + obj.width / 2;
        const objTop = obj.y - obj.height / 2;
        const objBottom = obj.y + obj.height / 2;

        const playerLeft = pos.x;
        const playerRight = pos.x + col.width;
        const playerTop = pos.y;
        const playerBottom = pos.y + col.height;

        // Broad-phase check
        if (playerRight < objLeft || playerLeft > objRight || playerBottom < objTop || playerTop > objBottom) {
            continue;
        }

        // Vertical Collision (Landing on top)
        if (vel.vy >= 0 && playerBottom >= objTop && playerBottom <= objBottom) {
            const prevPlayerBottom = playerBottom - vel.vy * (1/60); // A bit of a hack, assumes 60fps
             if (prevPlayerBottom <= objTop) {
                 this._landOnSurface(pos, vel, col, objTop, obj.type);
                 if (obj.type === 'fire_trap') {
                     obj.playerIsOnTop = true;
                     if (obj.state === 'off' || obj.state === 'turning_off') {
                         obj.state = 'activating'; 
                         obj.frame = 0; 
                         obj.frameTimer = 0;
                         eventBus.publish('playSound', { key: 'fire_activated', volume: 0.8, channel: 'SFX' });
                     }
                 }
                 continue; // Collision handled
             }
        }

        // Horizontal Collision
        if (playerBottom > objTop && playerTop < objBottom) {
            // Player moving right, collides with left side of object
            if (vel.vx > 0 && playerRight > objLeft && playerLeft < objLeft) {
                pos.x = objLeft - col.width;
                vel.vx = 0;
            }
            // Player moving left, collides with right side of object
            else if (vel.vx < 0 && playerLeft < objRight && playerRight > objRight) {
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
    const otherWidth = other.width || other.size;
    const otherHeight = other.height || other.size;
    const otherX = other.x - otherWidth / 2;
    const otherY = other.y - otherHeight / 2;
    return (
        pos.x < otherX + otherWidth &&
        pos.x + col.width > otherX &&
        pos.y < otherY + otherHeight &&
        pos.y + col.height > otherY
    );
  }

  _checkDynamicObjectInteractions(pos, vel, col, level, dt, entityId, entityManager) {
    this._checkFruitCollisions(pos, col, level, entityId, entityManager);
    this._checkTrophyCollision(pos, col, level.trophy, entityId, entityManager);
    this.checkCheckpointCollisions(pos, col, level, entityId, entityManager);
    this._checkTrapInteractions(pos, vel, col, level, dt, entityId, entityManager);
  }
  
  _checkTrapInteractions(pos, vel, col, level, dt, entityId, entityManager) {
    for (const spike of level.spikes) {
        if (this._isCollidingWith(pos, col, spike)) {
            // MODIFIED: Publish a generic collision event.
            eventBus.publish('collisionDetected', { entityA: entityId, entityB: spike, entityManager });
            return;
        }
    }

    for (const tramp of level.trampolines) {
        if (vel.vy <= 0) continue;
        const playerBottom = pos.y + col.height;
        const trampTop = tramp.y - tramp.size / 2;
        const trampLeft = tramp.x - tramp.size / 2;

        if (pos.x + col.width > trampLeft && pos.x < trampLeft + tramp.size) {
            if (playerBottom >= trampTop && (playerBottom - vel.vy * dt) <= trampTop + 1) {
                tramp.state = 'jumping'; tramp.frame = 0; tramp.frameTimer = 0;
                pos.y = trampTop - col.height;
                vel.vy = -PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER;
                eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
                return;
            }
        }
    }

    for (const trap of level.fireTraps) {
        if (trap.state === 'on') {
            const flameHitbox = {
                x: trap.x, y: trap.y - trap.height, width: trap.width, height: trap.height * 2
            };
            if (this._isCollidingWith(pos, col, flameHitbox)) {
                trap.damageTimer += dt;
                if (trap.damageTimer >= 1.0) {
                    trap.damageTimer -= 1.0;
                    eventBus.publish('playerTookDamage', { amount: 10, source: 'fire' });
                }
            }
        } else if (!trap.playerIsOnTop) {
            trap.damageTimer = 1.0;
        }
    }
  }

  _checkFruitCollisions(pos, col, level, entityId, entityManager) {
    for (const fruit of level.getActiveFruits()) {
        if (this._isCollidingWith(pos, col, fruit)) {
            // MODIFIED: Publish a generic collision event.
            eventBus.publish('collisionDetected', { entityA: entityId, entityB: fruit, entityManager });
        }
    }
  }

  _checkTrophyCollision(pos, col, trophy, entityId, entityManager) {
    if (!trophy || trophy.acquired || trophy.inactive) return;
    if (this._isCollidingWith(pos, col, trophy)) {
        // MODIFIED: Publish a generic collision event.
        eventBus.publish('collisionDetected', { entityA: entityId, entityB: trophy, entityManager });
    }
  }

  checkCheckpointCollisions(pos, col, level, entityId, entityManager) {
    for (const cp of level.getInactiveCheckpoints()) {
        if (this._isCollidingWith(pos, col, cp)) {
            // MODIFIED: Publish a generic collision event.
            eventBus.publish('collisionDetected', { entityA: entityId, entityB: cp, entityManager });
        }
    }
  }
}