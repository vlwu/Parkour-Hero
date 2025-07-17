import { PLAYER_CONSTANTS } from '../entities/player.js';
import { eventBus } from './event-bus.js';

// Physics and Collision detection/response system.
export class PhysicsSystem {
  constructor() {
    // No complex setup needed yet.
  }

  // The main update method that now drives player movement.
  update(player, level, dt, inputActions) {
    // --- 1. APPLY FORCES & VELOCITY ---

    // Update player's internal timers for coyote time, dash cooldown etc.
    player._updateTimers(dt);

    const prevX = player.x;
    const prevY = player.y;

    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
        player.vx = 0;
      }
    }

    // Jump logic
    if (player.jumpBufferTimer > 0 && (player.onGround || player.coyoteTimer > 0)) {
      let jumpForce = PLAYER_CONSTANTS.JUMP_FORCE;
      if (player.groundType === 'mud') {
        jumpForce *= PLAYER_CONSTANTS.MUD_JUMP_MULTIPLIER;
      }
      player.vy = -jumpForce;
      player.jumpCount = 1;
      player.onGround = false;
      player.jumpBufferTimer = 0;
      player.coyoteTimer = 0;
      player.jumpedThisFrame = 1;
    }

    // Horizontal movement physics
    if (!player.isDashing && !player.isSpawning) {
      if (player.isOnIce) {
        if (inputActions.moveLeft) {
          player.vx -= PLAYER_CONSTANTS.ICE_ACCELERATION * dt;
        } else if (inputActions.moveRight) {
          player.vx += PLAYER_CONSTANTS.ICE_ACCELERATION * dt;
        } else { // Apply friction
          if (player.vx > 0) {
            player.vx = Math.max(0, player.vx - PLAYER_CONSTANTS.ICE_FRICTION * dt);
          } else if (player.vx < 0) {
            player.vx = Math.min(0, player.vx + PLAYER_CONSTANTS.ICE_FRICTION * dt);
          }
        }
        player.vx = Math.max(-PLAYER_CONSTANTS.MOVE_SPEED, Math.min(PLAYER_CONSTANTS.MOVE_SPEED, player.vx));
      } else { // Standard movement
        const moveSpeed = (player.groundType === 'sand')
          ? PLAYER_CONSTANTS.MOVE_SPEED * PLAYER_CONSTANTS.SAND_MOVE_MULTIPLIER
          : PLAYER_CONSTANTS.MOVE_SPEED;
        if (inputActions.moveLeft) {
          player.vx = -moveSpeed;
        } else if (inputActions.moveRight) {
          player.vx = moveSpeed;
        } else {
          player.vx = 0;
        }
      }
    }

    // Vertical movement (gravity)
    if (!player.isDashing && !player.isSpawning && !player.isDespawning) {
      player.vy += PLAYER_CONSTANTS.GRAVITY * dt;
    }
    player.vy = Math.min(player.vy, PLAYER_CONSTANTS.MAX_FALL_SPEED);


    // --- 2. BROAD-PHASE COLLISION DETECTION (Query the grid ONCE) ---
    // Query a slightly larger area to ensure we get all potential colliders for both X and Y movement.
    const queryWidth = player.width + Math.abs(player.vx * dt);
    const queryHeight = player.height + Math.abs(player.vy * dt);
    const potentialColliders = level.grid.query(player.x, player.y, queryWidth, queryHeight);
    
    const platformColliders = potentialColliders.filter(obj => obj.type === 'platform');

    // --- 3. NARROW-PHASE & COLLISION RESPONSE ---
    
    // Apply horizontal movement
    player.x += player.vx * dt;
    this._handleHorizontalCollisions(player, platformColliders, prevX);

    // Apply vertical movement
    player.y += player.vy * dt;
    const groundPlatform = this._handleVerticalCollisions(player, platformColliders, prevY);

    // Update player ground state based on collision results
    player.onGround = !!groundPlatform;
    player.groundType = player.onGround ? groundPlatform.terrainType : null;
    player.isOnIce = player.groundType === 'ice';

    if (player.onGround) {
      player.jumpCount = 0;
      player.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
    }
    
    // --- 4. CHECK LEVEL BOUNDS & OTHER INTERACTIONS ---
    
    if (level && player.y > level.height + 50) {
      eventBus.publish('playerDied');
    }
    player.x = Math.max(0, Math.min(player.x, level.width - player.width));

    // Check for non-platform collisions (fruits, checkpoints, etc.)
    this._checkFruitCollisions(player, potentialColliders);
    this._checkTrophyCollision(player, level.trophy);
    this._checkCheckpointCollisions(player, potentialColliders);
  }
  
  // --- Private Collision Resolution Methods (Moved from Player) ---

  _isCollidingWith(player, other) {
    return (
      player.x < other.x + other.width &&
      player.x + player.width > other.x &&
      player.y < other.y + other.height &&
      player.y + player.height > other.y
    );
  }

  _handleHorizontalCollisions(player, platforms, prevX) {
    player.isAgainstWall = false; // Reset wall state
    for (const platform of platforms) {
      if (!this._isCollidingWith(player, platform)) continue;

      const fromLeft = prevX + player.width <= platform.x;
      const fromRight = prevX >= platform.x + platform.width;

      if (fromLeft) player.x = platform.x - player.width;
      else if (fromRight) player.x = platform.x + platform.width;
      
      player.vx = 0;
      player.isAgainstWall = true;

      // Handle wall cling/slide state
      if (!player.onGround && player.vy >= 0) {
        player.state = 'cling';
        player.vy = 30; // Slow slide
        player.jumpCount = 1; // Allow wall jump
      }
      return; // Stop after first collision
    }
  }

  _handleVerticalCollisions(player, platforms, prevY) {
    const GROUND_TOLERANCE = 1;
    for (const platform of platforms) {
      if (!this._isCollidingWith(player, platform)) continue;

      const hitFromAbove = prevY + player.height <= platform.y + GROUND_TOLERANCE && player.vy >= 0;
      const hitFromBelow = prevY >= platform.y + platform.height && player.vy < 0;

      if (hitFromAbove) {
        player.y = platform.y - player.height;
        player.vy = 0;
        return platform; // Return the platform we are standing on
      }
      if (hitFromBelow) {
        player.y = platform.y + platform.height;
        player.vy = 0; // Bonked head
      }
    }
    return null; // No ground collision
  }
  
  // --- Other Collision Checks (Previously CollisionSystem) ---

  _checkFruitCollisions(player, potentialColliders) {
    const px = player.x, py = player.y, pw = player.width, ph = player.height;

    for (const fruit of potentialColliders) {
      if (fruit.type === 'fruit' && !fruit.collected) {
        const fx = fruit.x - fruit.size / 2, fy = fruit.y - fruit.size / 2, fs = fruit.size;
        if (px < fx + fs && px + pw > fx && py < fy + fs && py + ph > fy) {
          eventBus.publish('fruitCollected', fruit);
        }
      }
    }
  }

  _checkTrophyCollision(player, trophy) {
    if (!trophy || trophy.acquired || trophy.inactive) {
      return;
    }
    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    const tx = trophy.x - trophy.size / 2, ty = trophy.y - trophy.size / 2, ts = trophy.size;
    if (px < tx + ts && px + pw > tx && py < ty + ts && py + ph > ty) {
      eventBus.publish('trophyCollision');
    }
  }
  
  _checkCheckpointCollisions(player, potentialColliders) {
    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    for (const cp of potentialColliders) {
      if (cp.type === 'checkpoint' && cp.state === 'inactive') {
        const cpx = cp.x - cp.size / 2, cpy = cp.y - cp.size / 2, cps = cp.size;
        if (px < cpx + cps && px + pw > cpx && py < cpy + cps && py + ph > cpy) {
          eventBus.publish('checkpointActivated', cp);
        }
      }
    }
  }
}