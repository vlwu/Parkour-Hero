import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class PhysicsSystem {
  constructor() {}

  update(dt, { entityManager, level, inputActions }) {
    const playerEntities = entityManager.query([PlayerControlledComponent, PositionComponent, VelocityComponent, CollisionComponent, RenderableComponent]);
    
    for (const entityId of playerEntities) {
      const pos = entityManager.getComponent(entityId, PositionComponent);
      const vel = entityManager.getComponent(entityId, VelocityComponent);
      const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
      const col = entityManager.getComponent(entityId, CollisionComponent);
      const renderable = entityManager.getComponent(entityId, RenderableComponent);

      this._updatePlayerState(dt, inputActions, pos, vel, ctrl, col, renderable, level);
    }
  }

  _updatePlayerState(dt, actions, pos, vel, ctrl, col, renderable, level) {
    this._updateTimers(dt, ctrl);
    this._handleInput(actions, pos, vel, ctrl, col, renderable);
    this._updateFSM(vel, ctrl, col, renderable);
    this._updateAnimation(dt, ctrl, renderable);
    this._updateSurfaceEffects(dt, pos, vel, col, ctrl);
    
    if (ctrl.isDashing) {
      ctrl.dashTimer -= dt;
      if (ctrl.dashTimer <= 0) ctrl.isDashing = false;
    }
    
    if (ctrl.isSpawning || ctrl.isDespawning) return;

    this._applyHorizontalMovement(dt, actions, vel, col, ctrl);
    this._applyVerticalMovement(dt, vel, col, ctrl);
    
    pos.x += vel.vx * dt;
    this._handleHorizontalCollisions(pos, vel, col, level);

    pos.y += vel.vy * dt;
    const bounced = this._checkTrampolineBounce(pos, vel, col, ctrl, renderable, level, dt);
    if (!bounced) {
      this._handleVerticalCollisions(pos, vel, col, ctrl, level, dt);
    }

    // Refresh coyote time every frame the player is on the ground.
    if (col.isGrounded) {
        ctrl.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
    }

    if (pos.y > level.height + 50) eventBus.publish('playerDied');
    pos.x = Math.max(0, Math.min(pos.x, level.width - col.width));

    this._checkHazardCollisions(pos, col, level);
    this._checkFruitCollisions(pos, col, level);
    this._checkTrophyCollision(pos, col, level.trophy);
    this.checkCheckpointCollisions(pos, col, level);
  }
  
  _updateTimers(dt, ctrl) {
    if (ctrl.jumpBufferTimer > 0) ctrl.jumpBufferTimer -= dt;
    if (ctrl.coyoteTimer > 0) ctrl.coyoteTimer -= dt;
    if (ctrl.dashCooldownTimer > 0) ctrl.dashCooldownTimer -= dt;
  }

  _handleInput(actions, pos, vel, ctrl, col, renderable) {
    if (ctrl.isSpawning || ctrl.isDashing || ctrl.isDespawning) {
      vel.vx = ctrl.isDashing ? vel.vx : 0;
      return;
    }
    
    if (actions.moveLeft) renderable.direction = 'left';
    else if (actions.moveRight) renderable.direction = 'right';

    // --- JUMP INPUT HANDLING (REWORKED) ---
    const justPressedJump = actions.jump && !ctrl.jumpPressed;

    // FIX: Buffer the jump if the key is held down, not just on the initial press.
    if (actions.jump) {
      ctrl.jumpBufferTimer = PLAYER_CONSTANTS.JUMP_BUFFER_TIME;
    }

    // Primary jump action (ground, wall, coyote) uses the buffer.
    if (ctrl.jumpBufferTimer > 0 && (col.isGrounded || ctrl.coyoteTimer > 0 || (col.isAgainstWall && !col.isGrounded))) {
        let jumpForce = ctrl.jumpForce;
        if (col.isAgainstWall && !col.isGrounded) {
            vel.vx = (renderable.direction === 'left' ? 1 : -1) * ctrl.speed;
            renderable.direction = renderable.direction === 'left' ? 'right' : 'left';
        } else if (col.groundType === 'mud') {
            jumpForce *= PLAYER_CONSTANTS.MUD_JUMP_MULTIPLIER;
        }
        vel.vy = -jumpForce;
        ctrl.jumpCount = 1;
        ctrl.jumpBufferTimer = 0; // Consume buffer
        ctrl.coyoteTimer = 0;     // Consume coyote time
        eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
    }

    // Double jump requires a fresh key press while in the air.
    if (justPressedJump && ctrl.jumpCount === 1 && !col.isGrounded && !col.isAgainstWall) {
      vel.vy = -ctrl.jumpForce;
      ctrl.jumpCount = 2;
      ctrl.jumpBufferTimer = 0; // Consume buffer
      this._setAnimationState(renderable, 'double_jump', ctrl);
      eventBus.publish('playSound', { key: 'double_jump', volume: 0.6, channel: 'SFX' });
      eventBus.publish('createParticles', { x: pos.x + col.width/2, y: pos.y + col.height, type: 'double_jump' });
    }
    ctrl.jumpPressed = actions.jump; // Update for next frame's justPressedJump check

    // --- DASH INPUT HANDLING (unchanged) ---
    if (actions.dash && !ctrl.dashPressed && ctrl.dashCooldownTimer <= 0) {
      ctrl.isDashing = true;
      ctrl.dashTimer = ctrl.dashDuration;
      vel.vx = renderable.direction === 'right' ? ctrl.dashSpeed : -ctrl.dashSpeed;
      vel.vy = 0;
      ctrl.dashCooldownTimer = PLAYER_CONSTANTS.DASH_COOLDOWN;
      this._setAnimationState(renderable, 'dash', ctrl);
      eventBus.publish('playSound', { key: 'dash', volume: 0.7, channel: 'SFX' });
      eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: 'dash', direction: renderable.direction });
    }
    ctrl.dashPressed = actions.dash;
  }

  _updateFSM(vel, ctrl, col, renderable) {
      const state = renderable.animationState;
      
      // If spawn is finished, transition to idle.
      if (state === 'spawn' && ctrl.spawnComplete) {
          this._setAnimationState(renderable, 'idle', ctrl);
          return;
      }
      
      // If the player is in a special, non-interruptible state, do not check other transitions.
      if (state === 'spawn' || state === 'despawn') {
          return;
      }
      
      // Regular state transitions
      if (ctrl.isDashing) {
          if(state !== 'dash') this._setAnimationState(renderable, 'dash', ctrl);
          return;
      }
      
      if(col.isAgainstWall && !col.isGrounded && vel.vy >= 0) {
          if(state !== 'cling') this._setAnimationState(renderable, 'cling', ctrl);
      } else if (!col.isGrounded) {
          if (vel.vy < 0 && state !== 'jump' && state !== 'double_jump') {
              this._setAnimationState(renderable, 'jump', ctrl);
          } else if (vel.vy >= 0 && state !== 'fall') {
              this._setAnimationState(renderable, 'fall', ctrl);
          }
      } else {
          if (Math.abs(vel.vx) > 1) {
              if (state !== 'run') this._setAnimationState(renderable, 'run', ctrl);
          } else {
              if (state !== 'idle') this._setAnimationState(renderable, 'idle', ctrl);
          }
      }
  }

  _setAnimationState(renderable, newState, ctrl) {
      if (renderable.animationState !== newState) {
          renderable.animationState = newState;
          renderable.animationFrame = 0;
          renderable.animationTimer = 0;
          if (newState === 'cling') ctrl.jumpCount = 1;
      }
  }

  _updateAnimation(dt, ctrl, renderable) {
    renderable.animationTimer += dt;
    const stateName = renderable.animationState;
    const speed = (stateName === 'spawn' || stateName === 'despawn') ? PLAYER_CONSTANTS.SPAWN_ANIMATION_SPEED : PLAYER_CONSTANTS.ANIMATION_SPEED;
    if (renderable.animationTimer < speed) return;
    renderable.animationTimer -= speed;
    const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[stateName] || 1;
    renderable.animationFrame++;
    if (stateName === 'spawn' || stateName === 'despawn') {
      if (renderable.animationFrame >= frameCount) {
        renderable.animationFrame = frameCount - 1;
        if (stateName === 'spawn') { 
            ctrl.isSpawning = false; ctrl.spawnComplete = true; 
            renderable.width = PLAYER_CONSTANTS.WIDTH; renderable.height = PLAYER_CONSTANTS.HEIGHT; 
        }
        if (stateName === 'despawn') { ctrl.isDespawning = false; ctrl.despawnAnimationFinished = true; }
      }
    } else { renderable.animationFrame %= frameCount; }
  }
  
  _updateSurfaceEffects(dt, pos, vel, col, ctrl) {
    const onGroundAndMoving = col.isGrounded && Math.abs(vel.vx) > 1 && !ctrl.isDashing;
    let requiredSound = onGroundAndMoving ? { 'sand': 'sand_walk', 'mud': 'mud_run', 'ice': 'ice_run' }[col.groundType] : null;
    if (requiredSound !== ctrl.activeSurfaceSound) {
        if (ctrl.activeSurfaceSound) eventBus.publish('stopSoundLoop', { key: ctrl.activeSurfaceSound });
        if (requiredSound) eventBus.publish('startSoundLoop', { key: requiredSound, channel: 'SFX' });
        ctrl.activeSurfaceSound = requiredSound;
    }
    if(onGroundAndMoving) {
        ctrl.surfaceParticleTimer += dt;
        if (ctrl.surfaceParticleTimer >= 0.1) {
            ctrl.surfaceParticleTimer = 0;
            const particleType = { 'sand': 'sand', 'mud': 'mud', 'ice': 'ice' }[col.groundType];
            if (particleType) eventBus.publish('createParticles', { x: pos.x + col.width/2, y: pos.y + col.height, type: particleType });
        }
    }
  }

  _applyHorizontalMovement(dt, actions, vel, col, ctrl) {
    if (ctrl.isDashing) return;
    if (col.isGrounded && col.groundType === 'ice') {
      const acc = PLAYER_CONSTANTS.ICE_ACCELERATION, fric = PLAYER_CONSTANTS.ICE_FRICTION;
      if (actions.moveLeft) vel.vx -= acc * dt; else if (actions.moveRight) vel.vx += acc * dt;
      else { vel.vx += (vel.vx > 0 ? -fric : fric) * dt; if (Math.abs(vel.vx) < fric * dt) vel.vx = 0; }
      vel.vx = Math.max(-ctrl.speed, Math.min(ctrl.speed, vel.vx));
    } else {
      let moveSpeed = ctrl.speed * (col.isGrounded && col.groundType === 'sand' ? PLAYER_CONSTANTS.SAND_MOVE_MULTIPLIER : 1);
      if (actions.moveLeft) vel.vx = -moveSpeed; else if (actions.moveRight) vel.vx = moveSpeed; else vel.vx = 0;
    }
  }
  
  _applyVerticalMovement(dt, vel, col, ctrl) {
    if (!ctrl.isDashing) {
      vel.vy += PLAYER_CONSTANTS.GRAVITY * dt;
    }
    if (col.isAgainstWall && !col.isGrounded) {
        vel.vy = Math.min(vel.vy, 30); // Slower slide speed
    }
    vel.vy = Math.min(vel.vy, PLAYER_CONSTANTS.MAX_FALL_SPEED);
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

  _handleVerticalCollisions(pos, vel, col, ctrl, level, dt) {
    const leftTile = Math.floor(pos.x / GRID_CONSTANTS.TILE_SIZE);
    const rightTile = Math.floor((pos.x + col.width - 1) / GRID_CONSTANTS.TILE_SIZE);
    const checkY = pos.y + col.height;
    const tileY = Math.floor(checkY / GRID_CONSTANTS.TILE_SIZE);
    
    let wasGrounded = col.isGrounded;
    col.isGrounded = false;

    for (let x = leftTile; x <= rightTile; x++) {
      const tile = level.getTileAt(x * GRID_CONSTANTS.TILE_SIZE, tileY * GRID_CONSTANTS.TILE_SIZE);
      if (tile && tile.solid && vel.vy >= 0) {
        const tileTop = tileY * GRID_CONSTANTS.TILE_SIZE;
        const playerBottom = pos.y + col.height;

        if (playerBottom >= tileTop && (playerBottom - vel.vy * dt) <= tileTop + 1) {
            pos.y = tileTop - col.height;
            vel.vy = 0;
            col.isGrounded = true;
            // FIX: Only reset jump count on the frame of landing.
            if (!wasGrounded) {
                ctrl.jumpCount = 0;
            }
            col.groundType = tile.interaction || tile.type; 
            return;
        }
      }
    }
  }
  
  _checkTrampolineBounce(pos, vel, col, ctrl, renderable, level, dt) {
    if (vel.vy <= 0) return false;
    for (const tramp of level.trampolines) {
        const playerBottom = pos.y + col.height;
        if (pos.x + col.width > tramp.x && pos.x < tramp.x + tramp.size) {
            if (playerBottom >= tramp.y && (playerBottom - vel.vy * dt) <= tramp.y + 1) {
                tramp.state = 'jumping'; tramp.frame = 0; tramp.frameTimer = 0;
                pos.y = tramp.y - col.height;
                vel.vy = -ctrl.jumpForce * PLAYER_CONSTANTS.TRAMPOLINE_BOUNCE_MULTIPLIER;
                ctrl.jumpCount = 0; ctrl.coyoteTimer = 0;
                this._setAnimationState(renderable, 'jump', ctrl);
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

  _checkHazardCollisions(pos, col, level) {
    const points = [
        { x: pos.x, y: pos.y },
        { x: pos.x + col.width - 1, y: pos.y },
        { x: pos.x, y: pos.y + col.height - 1 },
        { x: pos.x + col.width - 1, y: pos.y + col.height - 1 },
    ];
    for (const corner of points) {
        if (level.getTileAt(corner.x, corner.y).hazard) {
            eventBus.publish('playerDied');
            return;
        }
    }
  }

  _checkFruitCollisions(pos, col, level) {
    for (const fruit of level.getActiveFruits()) {
        if (this._isCollidingWith(pos, col, fruit)) {
            eventBus.publish('fruitCollected', fruit);
        }
    }
  }

  _checkTrophyCollision(pos, col, trophy) {
    if (!trophy || trophy.acquired || trophy.inactive) {
        return;
    }
    if (this._isCollidingWith(pos, col, trophy)) {
        eventBus.publish('trophyCollision');
    }
  }

  checkCheckpointCollisions(pos, col, level) {
    for (const cp of level.getInactiveCheckpoints()) {
        if (this._isCollidingWith(pos, col, cp)) {
            eventBus.publish('checkpointActivated', cp);
        }
    }
  }
}