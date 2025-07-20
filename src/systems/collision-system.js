import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class CollisionSystem {
  constructor() {}

  update(dt, { entityManager, level }) {
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
        const bounced = this._checkTrampolineBounce(pos, vel, col, level, dt);
        if (!bounced) {
            this._handleVerticalCollisions(pos, vel, col, level, dt, entityId);
        }

        pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));

        this._checkHazardCollisions(pos, col, level, entityId, entityManager);
        this._checkFruitCollisions(pos, col, level, entityId, entityManager);
        this._checkTrophyCollision(pos, col, level.trophy, entityId, entityManager);
        this.checkCheckpointCollisions(pos, col, level, entityId, entityManager);
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
    
    eventBus.publish('playerTookDamage', { amount: damage });
  }

  _handleVerticalCollisions(pos, vel, col, level, dt, entityId) {
    const leftTile = Math.floor(pos.x / GRID_CONSTANTS.TILE_SIZE);
    const rightTile = Math.floor((pos.x + col.width - 1) / GRID_CONSTANTS.TILE_SIZE);
    
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

    for (let x = leftTile; x <= rightTile; x++) {
      const tile = level.getTileAt(x * GRID_CONSTANTS.TILE_SIZE, tileY * GRID_CONSTANTS.TILE_SIZE);
      if (tile && tile.solid && vel.vy >= 0) {
        const tileTop = tileY * GRID_CONSTANTS.TILE_SIZE;
        const playerBottom = pos.y + col.height;

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

  _checkTrampolineBounce(pos, vel, col, level, dt) {
    if (vel.vy <= 0) return false;
    for (const tramp of level.trampolines) {
        const playerBottom = pos.y + col.height;
        if (pos.x + col.width > tramp.x && pos.x < tramp.x + tramp.size) {
            if (playerBottom >= tramp.y && (playerBottom - vel.vy * dt) <= tramp.y + 1) {
                tramp.state = 'jumping'; tramp.frame = 0; tramp.frameTimer = 0;
                pos.y = tramp.y - col.height;
                vel.vy = -PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER;
                eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
                return true;
            }
        }
    }
    return false;
  }
  
  _isCollidingWith(pos, col, other) {
    const otherWidth = other.width || other.size;
    const otherHeight = other.height || other.size;
    return (
        pos.x < other.x + otherWidth &&
        pos.x + col.width > other.x &&
        pos.y < other.y + otherHeight &&
        pos.y + col.height > other.y
    );
  }

  _checkHazardCollisions(pos, col, level, entityId, entityManager) {
    const points = [
        { x: pos.x, y: pos.y },
        { x: pos.x + col.width - 1, y: pos.y },
        { x: pos.x, y: pos.y + col.height - 1 },
        { x: pos.x + col.width - 1, y: pos.y + col.height - 1 },
    ];
    for (const corner of points) {
        if (level.getTileAt(corner.x, corner.y).hazard) {
            eventBus.publish('collisionEvent', { type: 'hazard', entityId, entityManager });
            return;
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