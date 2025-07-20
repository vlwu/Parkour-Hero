import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { StateComponent } from '../components/StateComponent.js';

/**
 * [Temporary System]
 * This system holds all the player-specific logic extracted from the old
 * physics system. It handles input responses, state transitions (FSM),
 * and special physics rules (like ice friction or dash speed).
 * In Phase 2, this system's logic will be broken down further into even
 * smaller, more specialized systems.
 */
export class PlayerSystem {
  constructor() {}

  update(dt, { entityManager }) {
    const playerEntities = entityManager.query([
        PlayerControlledComponent, 
        PositionComponent, 
        VelocityComponent, 
        CollisionComponent, 
        RenderableComponent,
        InputComponent,
        StateComponent
    ]);
    
    for (const entityId of playerEntities) {
      const pos = entityManager.getComponent(entityId, PositionComponent);
      const vel = entityManager.getComponent(entityId, VelocityComponent);
      const ctrl = entityManager.getComponent(entityId, PlayerControlledComponent);
      const col = entityManager.getComponent(entityId, CollisionComponent);
      const renderable = entityManager.getComponent(entityId, RenderableComponent);
      const input = entityManager.getComponent(entityId, InputComponent);
      const state = entityManager.getComponent(entityId, StateComponent);

      this._updatePlayerState(dt, input, pos, vel, ctrl, col, renderable, state);
    }
  }

  _updatePlayerState(dt, input, pos, vel, ctrl, col, renderable, state) {
    this._updateTimers(dt, ctrl);
    this._handleInput(input, pos, vel, ctrl, col, renderable, state);
    this._updateFSM(vel, ctrl, col, renderable, state);
    this._updateAnimation(dt, ctrl, renderable);
    this._updateSurfaceEffects(dt, pos, vel, col, ctrl);
    
    if (ctrl.isDashing) {
      ctrl.dashTimer -= dt;
      if (ctrl.dashTimer <= 0) ctrl.isDashing = false;
    }
    
    if (ctrl.isSpawning || ctrl.isDespawning) return;

    this._applyHorizontalMovement(dt, input, vel, col, ctrl);
    this._applyVerticalMovement(dt, vel, col, ctrl);
    
    if (col.isGrounded) {
        ctrl.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
    }
  }
  
  _updateTimers(dt, ctrl) {
    if (ctrl.jumpBufferTimer > 0) ctrl.jumpBufferTimer -= dt;
    if (ctrl.coyoteTimer > 0) ctrl.coyoteTimer -= dt;
    if (ctrl.dashCooldownTimer > 0) ctrl.dashCooldownTimer -= dt;
  }

  _handleInput(input, pos, vel, ctrl, col, renderable, state) {
    if (ctrl.isSpawning || ctrl.isDashing || ctrl.isDespawning) {
      vel.vx = ctrl.isDashing ? vel.vx : 0;
      return;
    }
    
    if (input.moveLeft) renderable.direction = 'left';
    else if (input.moveRight) renderable.direction = 'right';

    const justPressedJump = input.jump && !ctrl.jumpPressed;

    if (input.jump) {
      ctrl.jumpBufferTimer = PLAYER_CONSTANTS.JUMP_BUFFER_TIME;
    }
    
    if (ctrl.jumpBufferTimer > 0 && (col.isGrounded || ctrl.coyoteTimer > 0)) {
        let jumpForce = ctrl.jumpForce;
        if (col.groundType === 'mud') {
            jumpForce *= PLAYER_CONSTANTS.MUD_JUMP_MULTIPLIER;
        }
        vel.vy = -jumpForce;
        ctrl.jumpCount = 1;
        ctrl.jumpBufferTimer = 0;
        ctrl.coyoteTimer = 0;
        eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
    }
    else if (justPressedJump && col.isAgainstWall && !col.isGrounded) {
        vel.vx = (renderable.direction === 'left' ? 1 : -1) * ctrl.speed;
        renderable.direction = renderable.direction === 'left' ? 'right' : 'left';
        vel.vy = -ctrl.jumpForce;
        ctrl.jumpCount = 1;
        eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'SFX' });
    }
    else if (justPressedJump && ctrl.jumpCount === 1 && !col.isGrounded && !col.isAgainstWall) {
      vel.vy = -ctrl.jumpForce;
      ctrl.jumpCount = 2;
      ctrl.jumpBufferTimer = 0;
      this._setAnimationState(renderable, state, 'double_jump', ctrl);
      eventBus.publish('playSound', { key: 'double_jump', volume: 0.6, channel: 'SFX' });
      eventBus.publish('createParticles', { x: pos.x + col.width/2, y: pos.y + col.height, type: 'double_jump' });
    }
    
    ctrl.jumpPressed = input.jump;

    if (input.dash && !ctrl.dashPressed && ctrl.dashCooldownTimer <= 0) {
      ctrl.isDashing = true;
      ctrl.dashTimer = ctrl.dashDuration;
      vel.vx = renderable.direction === 'right' ? ctrl.dashSpeed : -ctrl.dashSpeed;
      vel.vy = 0;
      ctrl.dashCooldownTimer = PLAYER_CONSTANTS.DASH_COOLDOWN;
      this._setAnimationState(renderable, state, 'dash', ctrl);
      eventBus.publish('playSound', { key: 'dash', volume: 0.7, channel: 'SFX' });
      eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: 'dash', direction: renderable.direction });
    }
    ctrl.dashPressed = input.dash;
  }

  _updateFSM(vel, ctrl, col, renderable, state) {
      const currentState = state.currentState;
      
      if (currentState === 'spawn' && ctrl.spawnComplete) {
          this._setAnimationState(renderable, state, 'idle', ctrl);
          return;
      }
      
      if (currentState === 'spawn' || currentState === 'despawn') {
          return;
      }
      
      if (ctrl.isDashing) {
          if(currentState !== 'dash') this._setAnimationState(renderable, state, 'dash', ctrl);
          return;
      }
      
      if(col.isAgainstWall && !col.isGrounded && vel.vy >= 0) {
          if(currentState !== 'cling') this._setAnimationState(renderable, state, 'cling', ctrl);
      } else if (!col.isGrounded) {
          if (vel.vy < 0 && currentState !== 'jump' && currentState !== 'double_jump') {
              this._setAnimationState(renderable, state, 'jump', ctrl);
          } else if (vel.vy >= 0 && currentState !== 'fall') {
              this._setAnimationState(renderable, state, 'fall', ctrl);
          }
      } else {
          if (!col.isGrounded) {
            ctrl.jumpCount = 1; // Reset jump count if you fall off a ledge
          } else if (col.isGrounded && currentState !== 'jump') { // Only reset if grounded and not in initial jump state
            ctrl.jumpCount = 0;
          }

          if (Math.abs(vel.vx) > 1) {
              if (currentState !== 'run') this._setAnimationState(renderable, state, 'run', ctrl);
          } else {
              if (currentState !== 'idle') this._setAnimationState(renderable, state, 'idle', ctrl);
          }
      }
  }

  _setAnimationState(renderable, state, newState, ctrl) {
      if (state.currentState !== newState) {
          state.currentState = newState;
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

  _applyHorizontalMovement(dt, input, vel, col, ctrl) {
    if (ctrl.isDashing) return;
    if (col.isGrounded && col.groundType === 'ice') {
      const acc = PLAYER_CONSTANTS.ICE_ACCELERATION, fric = PLAYER_CONSTANTS.ICE_FRICTION;
      if (input.moveLeft) vel.vx -= acc * dt; else if (input.moveRight) vel.vx += acc * dt;
      else { vel.vx += (vel.vx > 0 ? -fric : fric) * dt; if (Math.abs(vel.vx) < fric * dt) vel.vx = 0; }
      vel.vx = Math.max(-ctrl.speed, Math.min(ctrl.speed, vel.vx));
    } else {
      let moveSpeed = ctrl.speed * (col.isGrounded && col.groundType === 'sand' ? PLAYER_CONSTANTS.SAND_MOVE_MULTIPLIER : 1);
      if (input.moveLeft) vel.vx = -moveSpeed; else if (input.moveRight) vel.vx = moveSpeed; else vel.vx = 0;
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
}