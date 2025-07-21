import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class CollisionSystem {
  constructor() {}

  update(dt, { entityManager, level }) {
    // Reset fire trap state before processing collisions
    for (const trap of level.fireTraps) {
        trap.playerIsOnTop = false;
    }
      
    const entities = entityManager.query([PositionComponent, VelocityComponent, CollisionComponent]);
    
    for (const entityId of entities) {
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const vel = entityManager.getComponent(entityId, VelocityComponent);
        const col = entityManager.getComponent(entityId, CollisionComponent);

        if (pos.y > level.height + 50) {
            eventBus.publish('collisionEvent', { type: 'world_bottom', entityId, entityManager });
            continue; 
        }

        pos.x += vel.vx * dt;
        this._handleHorizontalCollisions(pos, vel, col, level);

        pos.y += vel.vy * dt;
        
        // Vertical collision must be handled before trap checks that depend on it
        this._handleVerticalCollisions(pos, vel, col, level, dt, entityId);

        pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));

        // Now check for collisions with dynamic objects
        this._checkDynamicObjectCollisions(pos, col, level, dt, entityId, entityManager);
    }
  }

  _handleHorizontalCollisions(pos, vel, col, level) {
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

  _calculateAndApplyFallDamage(velocity) {
    const { 
        FALL_DAMAGE_MIN_VELOCITY, 
        FALL_DAMAGE_MAX_VELOCITY, 
        FALL_DAMAGE_MIN_AMOUNT, 
        FALL_DAMAGE_MAX_AMOUNT 
    } = PLAYER_CONSTANTS;

    const clampedVelocity = Math.max(FALL_DAMAGE_MIN_VELOCITY, Math.min(velocity, FALL_DAMAGE_MAX_VELOCITY));
    const progress = (clampedVelocity - FALL_DAMAGE_MIN_VELOCITY) / (FALL_DAMAGE_MAX_VELOCITY - FALL_DAMAGE_MIN_VELOCITY);
    const damage = Math.round(FALL_DAMAGE_MIN_AMOUNT + progress * (FALL_DAMAGE_MAX_AMOUNT - FALL_DAMAGE_MIN_AMOUNT));
    
    eventBus.publish('playerTookDamage', { amount: damage, source: 'fall' });
  }

  _handleVerticalCollisions(pos, vel, col, level, dt, entityId) {
    const leftTile = Math.floor(pos.x / GRID_CONSTANTS.TILE_SIZE);
    const rightTile = Math.floor((pos.x + col.width - 1) / GRID_CONSTANTS.TILE_SIZE);
    
    // Upward collision
    if (vel.vy < 0) {
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

    // Downward collision (landing)
    for (let x = leftTile; x <= rightTile; x++) {
      const tile = level.getTileAt(x * GRID_CONSTANTS.TILE_SIZE, tileY * GRID_CONSTANTS.TILE_SIZE);
      if (tile && tile.solid && vel.vy >= 0) {
        const tileTop = tileY * GRID_CONSTANTS.TILE_SIZE;
        const playerBottom = pos.y + col.height;

        // Check if player's bottom edge is at or just above the tile's top edge
        if (playerBottom >= tileTop && (playerBottom - vel.vy * dt) <= tileTop + 1) {
            
            const landingVelocity = vel.vy;
            if (landingVelocity >= PLAYER_CONSTANTS.FALL_DAMAGE_MIN_VELOCITY) {
                this._calculateAndApplyFallDamage(landingVelocity);
            }
            
            pos.y = tileTop - col.height;
            vel.vy = 0;
            col.isGrounded = true;
            col.groundType = tile.interaction || tile.type; 
            return;
        }
      }
    }
  }

  // Generic collision check for AABB
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

  _checkDynamicObjectCollisions(pos, col, level, dt, entityId, entityManager) {
    this._checkFruitCollisions(pos, col, level, entityId, entityManager);
    this._checkTrophyCollision(pos, col, level.trophy, entityId, entityManager);
    this.checkCheckpointCollisions(pos, col, level, entityId, entityManager);
    this._checkTrapCollisions(pos, col, level, dt, entityId, entityManager);
  }
  
  _checkTrapCollisions(pos, col, level, dt, entityId, entityManager) {
    // Spikes
    for (const spike of level.spikes) {
        if (this._isCollidingWith(pos, col, spike)) {
            eventBus.publish('collisionEvent', { type: 'hazard', entityId, entityManager });
            return; // Player hit a hazard, no need to check others this frame
        }
    }

    // Trampolines
    for (const tramp of level.trampolines) {
        const playerBottom = pos.y + col.height;
        const trampTop = tramp.y - tramp.size / 2;
        const trampLeft = tramp.x - tramp.size / 2;

        if (pos.x + col.width > trampLeft && pos.x < trampLeft + tramp.size) {
            if (playerBottom >= trampTop && (playerBottom - col.vy * dt) <= trampTop + 1) {
                tramp.state = 'jumping'; tramp.frame = 0; tramp.frameTimer = 0;
                pos.y = trampTop - col.height;
                vel.vy = -PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER;
                eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
                return; // Player bounced, vertical state is set
            }
        }
    }

    // Fire Traps
    for (const trap of level.fireTraps) {
        const playerBottom = pos.y + col.height;
        const trapTop = trap.y - trap.height / 2;
        const trapLeft = trap.x - trap.width / 2;

        const isOnTop = pos.x + col.width > trapLeft &&
                        pos.x < trapLeft + trap.width &&
                        Math.abs(playerBottom - trapTop) < 2;

        if (isOnTop) {
            trap.playerIsOnTop = true;
            if (trap.state === 'off' || trap.state === 'turning_off') {
                trap.state = 'activating';
                trap.frame = 0;
                trap.frameTimer = 0;
            }
        }

        if (trap.state === 'on') {
            const flameHitbox = {
                x: trap.x,
                y: trap.y - trap.height, // Flame is above the base
                size: trap.width
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
            eventBus.publish('collisionEvent', { type: 'fruit', entityId, target: fruit, entityManager });
        }
    }
  }

  _checkTrophyCollision(pos, col, trophy, entityId, entityManager) {
    if (!trophy || trophy.acquired || trophy.inactive) return;
    if (this._isCollidingWith(pos, col, trophy)) {
        eventBus.publish('collisionEvent', { type: 'trophy', entityId, target: trophy, entityManager });
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