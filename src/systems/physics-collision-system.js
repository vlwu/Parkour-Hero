import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';

/**
 * Handles all physics calculations, collision detection, and collision response.
 * This system is now tile-based for all static level geometry.
 */
export class PhysicsSystem {
  constructor() {
    // No setup needed.
  }

  update(player, level, dt, inputActions) {
    // --- 1. APPLY FORCES & VELOCITY (Largely Unchanged) ---
    player._updateTimers(dt);

    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
        player.vx = 0;
      }
    }

    // Jump logic
    const isClinging = player.currentState.name === 'cling';
    if (player.jumpBufferTimer > 0 && (player.onGround || player.coyoteTimer > 0 || isClinging)) {
      let jumpForce = PLAYER_CONSTANTS.JUMP_FORCE;
      if (isClinging) {
        player.vx = (player.direction === 'left' ? 1 : -1) * PLAYER_CONSTANTS.MOVE_SPEED;
        player.direction = player.direction === 'left' ? 'right' : 'left';
      } else if (player.groundType === 'mud') {
        jumpForce *= PLAYER_CONSTANTS.MUD_JUMP_MULTIPLIER;
      }
      player.vy = -jumpForce;
      player.jumpCount = 1;
      player.onGround = false;
      player.jumpBufferTimer = 0;
      player.coyoteTimer = 0;
      eventBus.publish('playSound', { key: 'jump', volume: 0.8 });
    }

    // Horizontal movement physics
    if (!player.isDashing && !player.isSpawning && !player.isDespawning) {
      const moveSpeed = (player.groundType === 'sand')
        ? PLAYER_CONSTANTS.MOVE_SPEED * PLAYER_CONSTANTS.SAND_MOVE_MULTIPLIER
        : PLAYER_CONSTANTS.MOVE_SPEED;
      
      if (inputActions.moveLeft) player.vx = -moveSpeed;
      else if (inputActions.moveRight) player.vx = moveSpeed;
      else player.vx = 0;
    }

    // Vertical movement (gravity)
    if (!player.isDashing && !player.isSpawning && !player.isDespawning) {
      player.vy += PLAYER_CONSTANTS.GRAVITY * dt;
    }
    player.vy = Math.min(player.vy, PLAYER_CONSTANTS.MAX_FALL_SPEED);


    // --- 2. COLLISION DETECTION & RESPONSE (Completely Reworked) ---
    // The SpatialHashGrid query is no longer needed for static platforms.
    // We resolve movement on each axis independently.

    // Apply horizontal movement and check for collisions
    player.x += player.vx * dt;
    this._handleHorizontalCollisions(player, level);

    // Apply vertical movement and check for collisions
    player.y += player.vy * dt;
    this._handleVerticalCollisions(player, level);


    // --- 3. CHECK LEVEL BOUNDS & OTHER INTERACTIONS ---
    if (player.y > level.height + 50) {
      eventBus.publish('playerDied');
    }
    player.x = Math.max(0, Math.min(player.x, level.width - player.width));

    // Check for non-platform collisions using simple iteration.
    // This is efficient enough as these are dynamic, non-grid objects.
    this._checkHazardCollisions(player, level);
    this._checkFruitCollisions(player, level);
    this._checkTrophyCollision(player, level.trophy);
    this.checkCheckpointCollisions(player, level);
  }

  _handleHorizontalCollisions(player, level) {
    player.isAgainstWall = false; // Reset wall state each frame
    const tileSize = GRID_CONSTANTS.TILE_SIZE;
    const isMovingRight = player.vx > 0;

    if (player.vx === 0) return;

    // Define the vertical range of tiles the player occupies
    const topTile = Math.floor(player.y / tileSize);
    const bottomTile = Math.floor((player.y + player.height - 1) / tileSize);

    // Determine the horizontal tile to check
    const checkX = isMovingRight ? player.x + player.width : player.x;
    const tileX = Math.floor(checkX / tileSize);

    for (let y = topTile; y <= bottomTile; y++) {
      const tile = level.getTileAt(tileX * tileSize, y * tileSize);
      if (tile && tile.solid) {
        if (isMovingRight) {
          player.x = tileX * tileSize - player.width;
        } else { // Moving left
          player.x = (tileX + 1) * tileSize;
        }
        player.vx = 0;
        
        // Wall cling logic can be refined here based on tile properties if needed
        const unClimbableWalls = ['dirt', 'sand', 'mud', 'ice'];
        if (!unClimbableWalls.includes(tile.type)) {
            player.isAgainstWall = true;
            if (!player.onGround && player.vy >= 0) {
                player.transitionTo('cling');
                player.vy = 30; // Slow slide
            }
        }
        return; // Exit after the first collision is found and resolved
      }
    }
  }

  _handleVerticalCollisions(player, level) {
    player.onGround = false; // Assume not on ground until proven otherwise
    const tileSize = GRID_CONSTANTS.TILE_SIZE;
    const isMovingDown = player.vy > 0;
    
    if (player.vy === 0) return;

    // Define the horizontal range of tiles the player occupies
    const leftTile = Math.floor(player.x / tileSize);
    const rightTile = Math.floor((player.x + player.width - 1) / tileSize);

    // Determine the vertical tile to check
    const checkY = isMovingDown ? player.y + player.height : player.y;
    const tileY = Math.floor(checkY / tileSize);

    for (let x = leftTile; x <= rightTile; x++) {
      const tile = level.getTileAt(x * tileSize, tileY * tileSize);
      if (tile && tile.solid) {
        if (isMovingDown) {
          player.y = tileY * tileSize - player.height;
          player.onGround = true;
          player.jumpCount = 0;
          player.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
          player.groundType = tile.interaction || tile.type; // Update ground type for surface effects
        } else { // Moving up
          player.y = (tileY + 1) * tileSize;
        }
        player.vy = 0;
        return; // Exit after the first collision is found and resolved
      }
    }
  }

  _checkHazardCollisions(player, level) {
    // Check the four corners of the player's bounding box for hazard tiles
    const checkPoints = [
      { x: player.x, y: player.y },                                // Top-left
      { x: player.x + player.width - 1, y: player.y },             // Top-right
      { x: player.x, y: player.y + player.height - 1 },            // Bottom-left
      { x: player.x + player.width - 1, y: player.y + player.height - 1 } // Bottom-right
    ];

    for (const point of checkPoints) {
      const tile = level.getTileAt(point.x, point.y);
      if (tile.hazard) {
        eventBus.publish('playerDied');
        return; // No need to check further
      }
    }
  }

  // AABB check helper for dynamic objects
  _isCollidingWith(player, other) {
    return (
      player.x < other.x + (other.width || other.size) &&
      player.x + player.width > other.x &&
      player.y < other.y + (other.height || other.size) &&
      player.y + player.height > other.y
    );
  }
  
  _checkFruitCollisions(player, level) {
    for (const fruit of level.getActiveFruits()) {
      if (this._isCollidingWith(player, fruit)) {
        eventBus.publish('fruitCollected', fruit);
      }
    }
  }

  _checkTrophyCollision(player, trophy) {
    if (!trophy || trophy.acquired || trophy.inactive) return;
    if (this._isCollidingWith(player, trophy)) {
      eventBus.publish('trophyCollision');
    }
  }
  
  checkCheckpointCollisions(player, level) {
    for (const cp of level.getInactiveCheckpoints()) {
      if (this._isCollidingWith(player, cp)) {
        eventBus.publish('checkpointActivated', cp);
      }
    }
  }
}