import { eventBus } from '../core/event-bus.js';

// Optimized for performance, robustness, and clarity.
// Version 2.7 - Fixed wall-jump FSM state loop.

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
  // The update logic is removed from here. The state will now persist until it is changed externally by the player's main update method.
  update(player) { }
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
    this.configs = {
        player: assets.configs.player,
        animations: assets.configs.animations
    };
    this.x = x;
    this.y = y;
    this.width = this.configs.player.dimensions.width;
    this.height = this.configs.player.dimensions.height;
    this.spawnWidth = this.configs.player.dimensions.spawnWidth;
    this.spawnHeight = this.configs.player.dimensions.spawnHeight;

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
            this.jumpBufferTimer = this.configs.player.timers.jumpBuffer;
        }
    }

    if (this.jumpBufferTimer > 0 && this.jumpCount < 1) {
        this.transitionTo('jump');
    }

    if (inputActions.jump && !this.jumpPressed && this.jumpCount === 1 && !this.onGround) {
      this.vy = -this.configs.player.physics.jumpForce;
      this.jumpCount = 2;
      this.jumpBufferTimer = 0;
      this.transitionTo('double_jump');
    }
    this.jumpPressed = inputActions.jump;

    if (inputActions.dash && !this.dashPressed && this.dashCooldownTimer <= 0) {
      this.isDashing = true;
      this.dashTimer = this.configs.player.dash.duration;
      this.vx = this.direction === 'right' ? this.configs.player.dash.speed : -this.configs.player.dash.speed;
      this.vy = 0;
      this.dashCooldownTimer = this.configs.player.dash.cooldown;
      this.transitionTo('dash');
    }
    this.dashPressed = inputActions.dash;
  }

  update(dt) {
    try {
      // This check must happen after the state has had a chance to run and before the next render.
      if (this.spawnComplete && this.state === 'spawn') {
          this.transitionTo('idle');
      }
      
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

  getRenderData() {
    if (this.despawnAnimationFinished) return null;

    const isSpecialAnim = this.state === 'spawn' || this.state === 'despawn';
    const renderWidth = isSpecialAnim ? this.spawnWidth : this.width;
    const renderHeight = isSpecialAnim ? this.spawnHeight : this.height;
    
    return {
        type: 'player',
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        renderWidth: renderWidth,
        renderHeight: renderHeight,
        offsetX: (isSpecialAnim ? -(this.spawnWidth - this.width) / 2 : 0) + ((this.state === 'cling') ? this.configs.player.dimensions.clingOffset : 0),
        offsetY: isSpecialAnim ? -(this.spawnHeight - this.height) / 2 : 0,
        spriteKey: this.getSpriteKey(),
        characterId: this.characterId,
        frame: this.animationFrame,
        frameCount: this.configs.animations.player.frames[this.state] || 1,
        direction: this.direction,
        fallbackColor: '#FF00FF'
    };
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
        ? this.configs.animations.player.spawnSpeed 
        : this.configs.animations.player.speed;

    if (this.animationTimer < speed) return;
    
    this.animationTimer -= speed;
    const frameCount = this.configs.animations.player.frames[this.state] || 1;
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