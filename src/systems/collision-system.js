import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { BouncePlatformComponent } from '../components/BouncePlatformComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class CollisionSystem {
  constructor() {}

  update(dt, { entityManager, level }) {
    const collidableEntities = entityManager.query([PositionComponent, CollisionComponent]);
    
    for (const entityId of collidableEntities) {
        if (entityManager.hasComponent(entityId, PlayerControlledComponent)) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);

            if (pos.y > level.height + 50) {
                eventBus.publish('worldBoundaryCollision', { type: 'world_bottom', entityId, entityManager });
                continue; 
            }

            if (vel) {
                pos.x += vel.vx * dt;
                this._handleTileHorizontalCollisions(pos, vel, col, level);
                pos.y += vel.vy * dt;
                this._handleTileVerticalCollisions(pos, vel, col, level, dt, entityManager);
            }
        }
    }

    for (let i = 0; i < collidableEntities.length; i++) {
        for (let j = i + 1; j < collidableEntities.length; j++) {
            const idA = collidableEntities[i];
            const idB = collidableEntities[j];
            const posA = entityManager.getComponent(idA, PositionComponent);
            const colA = entityManager.getComponent(idA, CollisionComponent);
            const posB = entityManager.getComponent(idB, PositionComponent);
            const colB = entityManager.getComponent(idB, CollisionComponent);

            const a_isPlayer = entityManager.hasComponent(idA, PlayerControlledComponent);
            const b_isPlayer = entityManager.hasComponent(idB, PlayerControlledComponent);
            const ax = a_isPlayer ? posA.x : posA.x - colA.width / 2;
            const ay = a_isPlayer ? posA.y : posA.y - colA.height / 2;
            const bx = b_isPlayer ? posB.x : posB.x - colB.width / 2;
            const by = b_isPlayer ? posB.y : posB.y - colB.height / 2;

            if (ax < bx + colB.width && ax + colA.width > bx && ay < by + colB.height && ay + colA.height > by) {
                if (colA.solid && colB.solid) {
                    this._resolveSolidEntityCollision(idA, idB, dt, entityManager);
                }
                eventBus.publish('collisionDetected', { entityA: idA, entityB: idB, entityManager });
                eventBus.publish('collisionDetected', { entityA: idB, entityB: idA, entityManager });
            }
        }
    }

    const playerEntities = entityManager.query([PlayerControlledComponent, PositionComponent, CollisionComponent]);
    for (const entityId of playerEntities) {
      const pos = entityManager.getComponent(entityId, PositionComponent);
      const col = entityManager.getComponent(entityId, CollisionComponent);
      this._checkRawObjectInteractions(pos, col, level, entityId, entityManager);
    }
  }

  _resolveSolidEntityCollision(idA, idB, dt, entityManager) {
    const aIsPlayer = entityManager.hasComponent(idA, PlayerControlledComponent);
    const bIsPlayer = entityManager.hasComponent(idB, PlayerControlledComponent);
    if (!aIsPlayer && !bIsPlayer) return;

    const playerId = aIsPlayer ? idA : idB;
    const obstacleId = aIsPlayer ? idB : idA;

    const pPos = entityManager.getComponent(playerId, PositionComponent);
    const pCol = entityManager.getComponent(playerId, CollisionComponent);
    const pVel = entityManager.getComponent(playerId, VelocityComponent);
    const oPos = entityManager.getComponent(obstacleId, PositionComponent);
    const oCol = entityManager.getComponent(obstacleId, CollisionComponent);

    if (!pPos || !pCol || !pVel || !oPos || !oCol) return;

    const pLeft = pPos.x, pRight = pPos.x + pCol.width;
    const pTop = pPos.y, pBottom = pPos.y + pCol.height;
    const oLeft = oPos.x - oCol.width / 2, oRight = oPos.x + oCol.width / 2;
    const oTop = oPos.y - oCol.height / 2, oBottom = oPos.y + oCol.height / 2;

    const overlapX = Math.min(pRight, oRight) - Math.max(pLeft, oLeft);
    const overlapY = Math.min(pBottom, oBottom) - Math.max(pTop, oTop);

    if (overlapX <= 0 || overlapY <= 0) return;

    // MODIFICATION: The entire resolution logic is replaced to be more robust.
    if (overlapX < overlapY) {
        // Horizontal collision has less overlap, resolve horizontally.
        if ((pRight - pLeft) / 2 + pLeft < (oRight - oLeft) / 2 + oLeft) {
            pPos.x -= overlapX; // Player is on the left, push left.
        } else {
            pPos.x += overlapX; // Player is on the right, push right.
        }
        pVel.vx = 0;
    } else {
        // Vertical collision has less or equal overlap, resolve vertically.
        if (pVel.vy >= 0) {
            // Player is moving down or is still, so treat this as a landing.
            this._landOnSurface(pPos, pVel, pCol, oTop, oCol.type || 'solid', obstacleId, entityManager);
        } else {
            // Player is moving up, so they are hitting the bottom of the obstacle.
            pPos.y += overlapY;
            pVel.vy = 0;
        }
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

  _handleTileVerticalCollisions(pos, vel, col, level, dt, entityManager) {
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

        if (playerBottom >= tileTop && (playerBottom - (vel.vy * dt)) <= tileTop + 1) {
            this._landOnSurface(pos, vel, col, tileTop, tile.interaction || tile.type, null, entityManager);
            return;
        }
      }
    }
  }

  _landOnSurface(pos, vel, col, surfaceTopY, surfaceType, entityId, entityManager) {
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

    if (entityId && entityManager.hasComponent(entityId, BouncePlatformComponent)) {
        const bounceComp = entityManager.getComponent(entityId, BouncePlatformComponent);
        const renderable = entityManager.getComponent(entityId, RenderableComponent);

        vel.vy = -bounceComp.force;
        col.isGrounded = true; 

        if (renderable && renderable.animationState !== 'jump') {
            renderable.animationState = 'jump';
            renderable.animationFrame = 0;
            renderable.animationTimer = 0;
            eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0, channel: 'SFX' });
        }
    }
  }
  
  _checkRawObjectInteractions(pos, col, level, entityId, entityManager) {
    this._checkFruitCollisions(pos, col, level, entityId, entityManager);
    this._checkTrophyCollision(pos, col, level.trophy, entityId, entityManager);
    this.checkCheckpointCollisions(pos, col, level, entityId, entityManager);
  }

  _isCollidingWithRaw(pos, col, other) {
    const otherWidth = other.size;
    const otherHeight = other.size;
    const otherX = other.x;
    const otherY = other.y;
    return (
        pos.x < otherX + otherWidth &&
        pos.x + col.width > otherX &&
        pos.y < otherY + otherHeight &&
        pos.y + col.height > otherY
    );
  }

  _checkFruitCollisions(pos, col, level, entityId, entityManager) {
    for (const fruit of level.getActiveFruits()) {
        if (this._isCollidingWithRaw(pos, col, fruit)) {
            eventBus.publish('collisionDetected', { entityA: entityId, entityB: fruit, entityManager });
        }
    }
  }

  _checkTrophyCollision(pos, col, trophy, entityId, entityManager) {
    if (!trophy || trophy.acquired || trophy.inactive) return;
    if (this._isCollidingWithRaw(pos, col, trophy)) {
        eventBus.publish('collisionDetected', { entityA: entityId, entityB: trophy, entityManager });
    }
  }

  checkCheckpointCollisions(pos, col, level, entityId, entityManager) {
    for (const cp of level.getInactiveCheckpoints()) {
        if (this._isCollidingWithRaw(pos, col, cp)) {
            eventBus.publish('collisionDetected', { entityA: entityId, entityB: cp, entityManager });
        }
    }
  }
}