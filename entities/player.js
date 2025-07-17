import { eventBus } from '../core/event-bus.js';

// Optimized for performance, robustness, and clarity.
// Version 2.7 - Fixed wall-jump FSM state loop.

export const PLAYER_CONSTANTS = {
  // Dimensions
  WIDTH: 32,
  HEIGHT: 32,
  SPAWN_WIDTH: 96,
  SPAWN_HEIGHT: 96,
  CLING_OFFSET: 7,

  // Physics
  MOVE_SPEED: 200,      // pixels/s
  JUMP_FORCE: 400,      // upward velocity impulse
  GRAVITY: 1200,        // downward acceleration
  MAX_FALL_SPEED: 500,  // terminal velocity

  // Dash
  DASH_SPEED: 500,
  DASH_DURATION: 0.2,   // seconds
  DASH_COOLDOWN: 0.5,   // seconds

  // Timers
  COYOTE_TIME: 0.1,     // seconds
  JUMP_BUFFER_TIME: 0.15, // seconds

  // Surface Modifiers
  SAND_MOVE_MULTIPLIER: 0.5,
  MUD_JUMP_MULTIPLIER: 0.6,
  ICE_ACCELERATION: 800,
  ICE_FRICTION: 400,

  // Animation
  ANIMATION_SPEED: 0.05,
  SPAWN_ANIMATION_SPEED: 0.08,
  ANIMATION_FRAMES: {
    idle: 11,
    run: 12,
    double_jump: 6,
    jump: 1,
    fall: 1,
    dash: 1,
    cling: 5,
    spawn: 7,
    despawn: 7,
  }
};

// --- FINITE STATE MACHINE (FSM) ---

class State {
  constructor(name) { this.name = name; }
  enter(player) {}
  exit(player) {}
  update(player, dt) {}
}

class IdleState extends State {
  constructor() { super('idle'); }
  update(player) {
    if (player.isDashing) { return player.transitionTo('dash'); }
    if (!player.onGround) { return player.transitionTo('fall'); }
    if (player.jumpBufferTimer > 0) { return player.transitionTo('jump'); }
    if (Math.abs(player.vx) > 1) { return player.transitionTo('run'); }
  }
}

class RunState extends State {
  constructor() { super('run'); }
  update(player) {
    if (player.isDashing) { return player.transitionTo('dash'); }
    if (!player.onGround) { return player.transitionTo('fall'); }
    if (player.jumpBufferTimer > 0) { return player.transitionTo('jump'); }
    if (Math.abs(player.vx) < 1) { return player.transitionTo('idle'); }
  }
}

class JumpState extends State {
  constructor() { super('jump'); }
  enter(player) {
    if (player.jumpCount === 1) { // First jump
        eventBus.publish('playSound', { key: 'jump', volume: 0.8 });
    }
  }
  update(player) {
    if (player.isDashing) { return player.transitionTo('dash'); }
    if (player.jumpCount === 2) { return player.transitionTo('double_jump'); }
    if (player.vy >= 0) { return player.transitionTo('fall'); }
    if (player.isAgainstWall && player.vy >= 0) { return player.transitionTo('cling'); }
  }
}

class DoubleJumpState extends State {
    constructor() { super('double_jump'); }
    enter(player) {
        eventBus.publish('playSound', { key: 'double_jump', volume: 0.6 });
        eventBus.publish('createParticles', { x: player.getCenterX(), y: player.y + player.height, type: 'double_jump' });
    }
    update(player) {
        if (player.isDashing) { return player.transitionTo('dash'); }
        if (player.vy >= 0) { return player.transitionTo('fall'); }
        if (player.isAgainstWall && player.vy >= 0) { return player.transitionTo('cling'); }
    }
}

class FallState extends State {
  constructor() { super('fall'); }
  update(player) {
    if (player.isDashing) { return player.transitionTo('dash'); }
    if (player.onGround) { return player.transitionTo('idle'); }
    if (player.isAgainstWall) { return player.transitionTo('cling'); }
  }
}

class DashState extends State {
  constructor() { super('dash'); }
  enter(player) {
      eventBus.publish('playSound', { key: 'dash', volume: 0.7 });
      eventBus.publish('createParticles', { x: player.getCenterX(), y: player.getCenterY(), type: 'dash', direction: player.direction });
  }
  update(player) {
    if (!player.isDashing) {
      player.transitionTo(player.onGround ? 'idle' : 'fall');
    }
  }
}

class ClingState extends State {
  constructor() { super('cling'); }
  enter(player) {
    player.jumpCount = 1; // Wall jumps are re-enabled upon clinging
  }
  update(player) {
    if (player.jumpBufferTimer > 0) { return player.transitionTo('jump'); }
    if (player.onGround) { return player.transitionTo('idle'); }
    if (!player.isAgainstWall) { return player.transitionTo('fall'); }
  }
}

class SpawnState extends State {
  constructor() { super('spawn'); }
  update(player) {
    if (player.spawnComplete) {
      player.transitionTo('idle');
    }
  }
}

class DespawnState extends State {
  constructor() { super('despawn'); }
  enter(player) {
    player.vx = 0;
    player.vy = 0;
  }
}

export class Player {
  constructor(x, y, assets, characterId) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_CONSTANTS.WIDTH;
    this.height = PLAYER_CONSTANTS.HEIGHT;
    this.spawnWidth = PLAYER_CONSTANTS.SPAWN_WIDTH;
    this.spawnHeight = PLAYER_CONSTANTS.SPAWN_HEIGHT;

    this.vx = 0;
    this.vy = 0;
    this.deathCount = 0;
    this.needsRespawn = false;

    this.jumpCount = 0;
    this.jumpPressed = false;
    this.direction = 'right';
    this.assets = assets;
    this.characterId = characterId || 'PinkMan';
    this.onGround = false;
    this.groundType = null;
    this.isOnIce = false;
    this.isAgainstWall = false;

    this.state = 'idle'; // Maintained for compatibility
    this.currentState = null;
    this.states = {
      idle: new IdleState(),
      run: new RunState(),
      jump: new JumpState(),
      double_jump: new DoubleJumpState(),
      fall: new FallState(),
      dash: new DashState(),
      cling: new ClingState(),
      spawn: new SpawnState(),
      despawn: new DespawnState(),
    };

    this.isSpawning = true;
    this.spawnComplete = false;
    this.isDespawning = false;
    this.despawnAnimationFinished = false;
    this.isDashing = false;
    this.dashPressed = false;

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.animationTimer = 0;
    this.animationFrame = 0;

    this.activeSurfaceSound = null;

    this.transitionTo(this.isSpawning ? 'spawn' : 'idle');
    console.log('Player initialized at:', x, y);
  }

  transitionTo(newStateName) {
    if (this.currentState && this.currentState.name === newStateName) return;
    
    const oldState = this.currentState;
    if (oldState) {
        oldState.exit(this);
    }

    this.currentState = this.states[newStateName];
    const oldStateName = this.state;
    this.state = newStateName;

    if (this.state !== oldStateName) {
        this.animationFrame = 0;
        this.animationTimer = 0;
    }
    
    this.currentState.enter(this);
  }

  handleInput(inputActions) {
    if (this.isSpawning || this.isDashing || this.isDespawning) {
      this.vx = this.isDashing ? this.vx : 0;
      return;
    }

    if (inputActions.moveLeft) this.direction = 'left';
    else if (inputActions.moveRight) this.direction = 'right';

    if (inputActions.jump) {
        if (!this.jumpPressed && this.jumpBufferTimer <= 0) {
            this.jumpBufferTimer = PLAYER_CONSTANTS.JUMP_BUFFER_TIME;
        }
    }

    if (this.jumpBufferTimer > 0 && this.jumpCount < 1) {
        this.transitionTo('jump');
    }

    if (inputActions.jump && !this.jumpPressed && this.jumpCount === 1 && !this.onGround) {
      this.vy = -PLAYER_CONSTANTS.JUMP_FORCE;
      this.jumpCount = 2;
      this.jumpBufferTimer = 0;
      this.transitionTo('double_jump');
    }
    this.jumpPressed = inputActions.jump;

    if (inputActions.dash && !this.dashPressed && this.dashCooldownTimer <= 0) {
      this.isDashing = true;
      this.dashTimer = PLAYER_CONSTANTS.DASH_DURATION;
      this.vx = this.direction === 'right' ? PLAYER_CONSTANTS.DASH_SPEED : -PLAYER_CONSTANTS.DASH_SPEED;
      this.vy = 0;
      this.dashCooldownTimer = PLAYER_CONSTANTS.DASH_COOLDOWN;
      this.transitionTo('dash');
    }
    this.dashPressed = inputActions.dash;
  }

  update(dt) {
    try {
      this.currentState.update(this, dt);
      this._updateAnimation(dt);
      this._updateSurfaceSound();
    } catch (error) {
      console.error('Error in player update:', error);
    }
  }

  startDespawn() {
    this.isDespawning = true;
    this.despawnAnimationFinished = false;
    this.transitionTo('despawn');
  }

  respawn(startPosition) {
    this.x = startPosition.x;
    this.y = startPosition.y;
    this.vx = 0;
    this.vy = 0;
    this.jumpCount = 0;
    this.jumpPressed = false;
    this.onGround = false;
    this.groundType = null;
    this.isOnIce = false;
    this.isAgainstWall = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.needsRespawn = false;
    this.isSpawning = true;
    this.spawnComplete = false;
    this.isDespawning = false;
    this.despawnAnimationFinished = false;
    this.transitionTo('spawn');
  }

  render(ctx) {
    try {
      if (this.despawnAnimationFinished && this.state !== 'despawn') return;

      const spriteKey = this.getSpriteKey();
      const characterSprites = this.assets.characters[this.characterId];
      let sprite = characterSprites?.[spriteKey] || this.assets[spriteKey];

      if (!sprite) {
        console.warn(`Sprite for ${spriteKey} (char: ${this.characterId}) not loaded.`);
        this.renderFallback(ctx);
        return;
      }

      const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[this.state] || 1;
      const frameWidth = sprite.width / frameCount;
      const srcX = frameWidth * this.animationFrame;

      ctx.save();
      if (this.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-this.x - this.width, this.y);
      } else {
        ctx.translate(this.x, this.y);
      }
      
      const isSpecialAnim = this.state === 'spawn' || this.state === 'despawn';
      const renderWidth = isSpecialAnim ? this.spawnWidth : this.width;
      const renderHeight = isSpecialAnim ? this.spawnHeight : this.height;
      const renderX = isSpecialAnim ? -(this.spawnWidth - this.width) / 2 : 0;
      const renderY = isSpecialAnim ? -(this.spawnHeight - this.height) / 2 : 0;
      const drawOffsetX = (this.state === 'cling') ? PLAYER_CONSTANTS.CLING_OFFSET : 0;

      ctx.drawImage(
        sprite,
        srcX, 0, frameWidth, sprite.height,
        drawOffsetX + renderX, renderY,
        renderWidth, renderHeight
      );

      ctx.restore();
    } catch (error) {
      console.error('Error rendering player:', error);
      this.renderFallback(ctx);
    }
  }

  getSpriteKey() {
    const stateToSpriteMap = {
      idle: 'playerIdle', run: 'playerRun', jump: 'playerJump',
      double_jump: 'playerDoubleJump', fall: 'playerFall',
      dash: 'playerDash', cling: 'playerCling', spawn: 'playerAppear',
      despawn: 'playerDisappear',
    };
    return stateToSpriteMap[this.state] || 'playerIdle';
  }

  renderFallback(ctx) {
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  _updateTimers(dt) {
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
  }

  _updateAnimation(dt) {
    this.animationTimer += dt;
    const speed = (this.state === 'spawn' || this.state === 'despawn') 
        ? PLAYER_CONSTANTS.SPAWN_ANIMATION_SPEED 
        : PLAYER_CONSTANTS.ANIMATION_SPEED;

    if (this.animationTimer < speed) return;
    
    this.animationTimer -= speed;
    const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[this.state] || 1;
    this.animationFrame++;

    const isOneShot = this.state === 'spawn' || this.state === 'despawn';
    if (isOneShot) {
      if (this.animationFrame >= frameCount) {
        this.animationFrame = frameCount - 1;
        if (this.state === 'spawn') {
          this.isSpawning = false;
          this.spawnComplete = true;
        }
        if (this.state === 'despawn') {
          this.isDespawning = false;
          this.despawnAnimationFinished = true;
        }
      }
    } else {
      this.animationFrame %= frameCount;
    }
  }

  _updateSurfaceSound() {
    let requiredSound = null;
    if (this.onGround && Math.abs(this.vx) > 1 && !this.isDashing) {
        switch (this.groundType) {
            case 'sand': requiredSound = 'sand_walk'; break;
            case 'mud': requiredSound = 'mud_run'; break;
            case 'ice': requiredSound = 'ice_run'; break;
        }
    }

    if (requiredSound !== this.activeSurfaceSound) {
        if (this.activeSurfaceSound) {
            eventBus.publish('stopSoundLoop', { key: this.activeSurfaceSound });
        }
        if (requiredSound) {
            eventBus.publish('startSoundLoop', { key: requiredSound });
        }
        this.activeSurfaceSound = requiredSound;
    }
  }
  
  getCenterX() { return this.x + this.width / 2; }
  getCenterY() { return this.y + this.height / 2; }
}