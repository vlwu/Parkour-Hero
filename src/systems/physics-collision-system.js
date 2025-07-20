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

  update(dt, { player, level, inputActions }) {
    // --- 1. APPLY FORCES & VELOCITY ---
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
      const moveSpeed = PLAYER_CONSTANTS.MOVE_SPEED;

      if (player.onGround && player.groundType === 'ice') {
        // Slippery physics for ice
        const acceleration = PLAYER_CONSTANTS.ICE_ACCELERATION;
        const friction = PLAYER_CONSTANTS.ICE_FRICTION;

        if (inputActions.moveLeft) {
          player.vx -= acceleration * dt;
        } else if (inputActions.moveRight) {
          player.vx += acceleration * dt;
        } else {
          // Apply friction if no input is given
          if (player.vx > 0) {
            player.vx -= friction * dt;
            if (player.vx < 0) player.vx = 0;
          } else if (player.vx < 0) {
            player.vx += friction * dt;
            if (player.vx > 0) player.vx = 0;
          }
        }
        // Clamp velocity to the maximum speed
        player.vx = Math.max(-moveSpeed, Math.min(moveSpeed, player.vx));

      } else {
        // Standard, non-slippery physics for all other surfaces
        let currentMoveSpeed = moveSpeed;
        // Apply sand penalty ONLY when the player is on the ground.
        if (player.onGround && player.groundType === 'sand') {
          currentMoveSpeed = moveSpeed * PLAYER_CONSTANTS.SAND_MOVE_MULTIPLIER;
        }
        
        if (inputActions.moveLeft) {
          player.vx = -currentMoveSpeed;
        } else if (inputActions.moveRight) {
          player.vx = currentMoveSpeed;
        } else {
          player.vx = 0; // Instant stop for snappy controls
        }
      }
    }

    // Vertical movement (gravity)
    if (!player.isDashing && !player.isSpawning && !player.isDespawning) {
      player.vy += PLAYER_CONSTANTS.GRAVITY * dt;
    }
    player.vy = Math.min(player.vy, PLAYER_CONSTANTS.MAX_FALL_SPEED);


    // --- 2. COLLISION DETECTION & RESPONSE ---
    // Apply horizontal movement and check for collisions
    player.x += player.vx * dt;
    this._handleHorizontalCollisions(player, level);

    // Apply vertical movement and check for collisions
    player.y += player.vy * dt;
    const bounced = this._checkTrampolineBounce(player, level, dt);
    if (!bounced) {
      this._handleVerticalCollisions(player, level);
    } else {
      player.onGround = false; // Ensure onGround is false after bouncing
    }


    // --- 3. CHECK LEVEL BOUNDS & OTHER INTERACTIONS ---
    if (player.y > level.height + 50) {
      eventBus.publish('playerDied');
    }
    player.x = Math.max(0, Math.min(player.x, level.width - player.width));

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
        
        const unClimbableWalls = ['dirt', 'sand', 'mud', 'ice'];
        if (!unClimbableWalls.includes(tile.type)) {
            player.isAgainstWall = true;
            if (!player.onGround && player.vy >= 0) {
                player.transitionTo('cling');
                player.vy = 30; // Slow slide
            }
        }
        return; 
      }
    }
  }

  _handleVerticalCollisions(player, level) {
    player.onGround = false; 
    const tileSize = GRID_CONSTANTS.TILE_SIZE;
    const isMovingDown = player.vy > 0;
    
    if (player.vy === 0) return;

    const leftTile = Math.floor(player.x / tileSize);
    const rightTile = Math.floor((player.x + player.width - 1) / tileSize);

    const checkY = isMovingDown ? player.y + player.height : player.y;
    const tileY = Math.floor(checkY / tileSize);

    for (let x = leftTile; x <= rightTile; x++) {
      const tile = level.getTileAt(x * tileSize, tileY * tileSize);
      if (tile && tile.solid) {
        if (isMovingDown) {
          player.y = tileY * tileSize - player.height;
          // Only reset ground-related properties if landing for the first time
          if (!player.onGround) {
            player.onGround = true;
            player.jumpCount = 0;
            player.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
            player.groundType = tile.interaction || tile.type; 
          }
        } else { // Moving up
          player.y = (tileY + 1) * tileSize;
        }
        player.vy = 0;
        return;
      }
    }
  }
  
  _checkTrampolineBounce(player, level, dt) {
    if (player.vy <= 0) {
        return false; // Only bounce when falling onto it
    }

    for (const tramp of level.trampolines) {
        const playerBottom = player.y + player.height;
        const playerHorizontalCenter = player.x + player.width / 2;

        const trampTop = tramp.y;
        const trampLeft = tramp.x;
        const trampRight = tramp.x + tramp.size;

        // Check for horizontal overlap.
        if (player.x + player.width > trampLeft && player.x < trampRight) {
            const prevPlayerBottom = playerBottom - player.vy * dt;
            
            // Check if player's bottom has just crossed the trampoline's top surface.
            if (playerBottom >= trampTop && prevPlayerBottom <= trampTop + 1) {
                // --- BOUNCE LOGIC ---
                tramp.state = 'jumping';
                tramp.frame = 0;
                tramp.frameTimer = 0;

                player.y = trampTop - player.height; // Snap position
                player.vy = -PLAYER_CONSTANTS.JUMP_FORCE * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER;
                player.jumpCount = 0; // Allow double jump after bounce
                player.coyoteTimer = 0; // No coyote time after a bounce
                player.transitionTo('jump');
                eventBus.publish('playSound', { key: 'trampoline_bounce', volume: 1.0 });

                return true; // Bounce occurred, stop further vertical checks.
            }
        }
    }
    return false;
  }

  _checkHazardCollisions(player, level) {
    const checkPoints = [
      { x: player.x, y: player.y },                                
      { x: player.x + player.width - 1, y: player.y },             
      { x: player.x, y: player.y + player.height - 1 },            
      { x: player.x + player.width - 1, y: player.y + player.height - 1 } 
    ];

    for (const point of checkPoints) {
      const tile = level.getTileAt(point.x, point.y);
      if (tile.hazard) {
        eventBus.publish('playerDied');
        return;
      }
    }
  }

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