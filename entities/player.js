// Optimized for performance, robustness, and clarity.
// Version 2.3 - Fixed cling state, dash event, and redundant physics.

const PLAYER_CONSTANTS = {
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
    this.state = 'idle';
    this.assets = assets;
    this.characterId = characterId || 'PinkMan';
    this.onGround = false;
    this.groundType = null; // e.g., 'dirt', 'sand', 'ice'
    this.isOnIce = false;
    this.isAgainstWall = false;

    // State flags
    this.isSpawning = true;
    this.spawnComplete = false;
    this.isDespawning = false;
    this.despawnAnimationFinished = false;
    this.isDashing = false;
    this.dashPressed = false;
    this.jumpedThisFrame = 0;
    this.dashedThisFrame = false;

    // Timers
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.animationTimer = 0;
    this.animationFrame = 0;

    // Sound control
    this.soundEvents = [];
    this.activeSurfaceSound = null;

    console.log('Player initialized at:', x, y);
  }

  handleInput(inputActions) {
    if (this.isSpawning || this.isDashing || this.isDespawning) {
      this.vx = this.isDashing ? this.vx : 0;
      return;
    }

    // Horizontal direction
    if (inputActions.moveLeft) {
      this.direction = 'left';
    } else if (inputActions.moveRight) {
      this.direction = 'right';
    }

    // Buffer jump input
    if (inputActions.jump) {
      this.jumpBufferTimer = PLAYER_CONSTANTS.JUMP_BUFFER_TIME;
    }

    // Double jump (requires a new press while airborne)
    if (inputActions.jump && !this.jumpPressed && this.jumpCount === 1 && !this.onGround) {
      this.vy = -PLAYER_CONSTANTS.JUMP_FORCE;
      this.jumpCount = 2;
      this.jumpBufferTimer = 0;
      this.jumpedThisFrame = 2; // Set flag for double jump sound/effect
    }
    this.jumpPressed = inputActions.jump;

    // Dash (requires a new press and cooldown)
    if (inputActions.dash && !this.dashPressed && this.dashCooldownTimer <= 0) {
      this.isDashing = true;
      this.dashTimer = PLAYER_CONSTANTS.DASH_DURATION;
      this.vx = this.direction === 'right' ? PLAYER_CONSTANTS.DASH_SPEED : -PLAYER_CONSTANTS.DASH_SPEED;
      this.vy = 0;
      this.dashCooldownTimer = PLAYER_CONSTANTS.DASH_COOLDOWN;
      this.dashedThisFrame = true;
    }
    this.dashPressed = inputActions.dash;
  }

  update(dt, level = null, inputActions = {}) {
    try {
      const prevState = this.state;
      this.isAgainstWall = false; // Reset collision flag each frame

      // Core gameplay logic only runs when the player is active.
      if (!this.isSpawning && !this.isDespawning) {
        this._updateGameplay(dt, level, inputActions);
      }

      // State determination and animation updates run every frame for all states.
      this._determineState();
      this._updateAnimation(dt, prevState);
      this._updateSurfaceSound();

    } catch (error) {
      console.error('Error in player update:', error);
    }
  }

  startDespawn() {
    this.isDespawning = true;
    this.despawnAnimationFinished = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.vx = this.vy = 0;
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
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.jumpedThisFrame = 0;
    this.dashedThisFrame = false;
  }
  
  handleHorizontalCollision(platforms, prevX) {
    for (const platform of platforms) {
      if (!this.isCollidingWith(platform)) continue;

      const fromLeft = prevX + this.width <= platform.x;
      const fromRight = prevX >= platform.x + platform.width;

      if (fromLeft) this.x = platform.x - this.width;
      else if (fromRight) this.x = platform.x + platform.width;
      
      this.vx = 0;
      this.isAgainstWall = true;

      if (!this.onGround && this.vy >= 0) {
        this.state = 'cling';
        this.vy = 30; 
        this.jumpCount = 1;
      }
      return; 
    }
  }

  handleVerticalCollision(platforms, prevY) {
    for (const platform of platforms) {
      if (!this.isCollidingWith(platform)) continue;

      const hitFromAbove = prevY + this.height <= platform.y && this.vy >= 0;
      const hitFromBelow = prevY >= platform.y + platform.height && this.vy < 0;

      if (hitFromAbove) {
        this.y = platform.y - this.height;
        this.vy = 0;
        return platform;
      }
      if (hitFromBelow) {
        this.y = platform.y + platform.height;
        this.vy = 0; 
      }
    }
    return null;
  }

  isCollidingWith(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
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

  getAndClearSoundEvents() {
    const events = [...this.soundEvents];
    this.soundEvents.length = 0;
    return events;
  }

  // --- Private Helper Methods ---

  _updateGameplay(dt, level, inputActions) {
    this._updateTimers(dt);

    const prevX = this.x;
    const prevY = this.y;

    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = 0;
      }
    }

    // Jump logic
    if (this.jumpBufferTimer > 0 && (this.onGround || this.coyoteTimer > 0)) {
      let jumpForce = PLAYER_CONSTANTS.JUMP_FORCE;
      if (this.groundType === 'mud') {
        jumpForce *= PLAYER_CONSTANTS.MUD_JUMP_MULTIPLIER;
      }
      this.vy = -jumpForce;
      this.jumpCount = 1;
      this.onGround = false;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.jumpedThisFrame = 1;
    }

    // Horizontal movement physics
    if (!this.isDashing) {
      if (this.isOnIce) {
        if (inputActions.moveLeft) {
          this.vx -= PLAYER_CONSTANTS.ICE_ACCELERATION * dt;
        } else if (inputActions.moveRight) {
          this.vx += PLAYER_CONSTANTS.ICE_ACCELERATION * dt;
        } else { // Apply friction
          if (this.vx > 0) {
            this.vx = Math.max(0, this.vx - PLAYER_CONSTANTS.ICE_FRICTION * dt);
          } else if (this.vx < 0) {
            this.vx = Math.min(0, this.vx + PLAYER_CONSTANTS.ICE_FRICTION * dt);
          }
        }
        this.vx = Math.max(-PLAYER_CONSTANTS.MOVE_SPEED, Math.min(PLAYER_CONSTANTS.MOVE_SPEED, this.vx));
      } else { // Standard movement
        const moveSpeed = (this.groundType === 'sand')
          ? PLAYER_CONSTANTS.MOVE_SPEED * PLAYER_CONSTANTS.SAND_MOVE_MULTIPLIER
          : PLAYER_CONSTANTS.MOVE_SPEED;
        if (inputActions.moveLeft) {
          this.vx = -moveSpeed;
        } else if (inputActions.moveRight) {
          this.vx = moveSpeed;
        } else {
          this.vx = 0;
        }
      }
    }

    // Vertical movement (gravity)
    if (!this.isDashing) this.vy += PLAYER_CONSTANTS.GRAVITY * dt;
    this.vy = Math.min(this.vy, PLAYER_CONSTANTS.MAX_FALL_SPEED);

    // Apply horizontal velocity and check for collisions
    this.x += this.vx * dt;
    if (level) {
        const potentialColliders = level.grid.query(this.x, this.y, this.width, this.height)
            .filter(obj => obj.type === 'platform');
        this.handleHorizontalCollision(potentialColliders, prevX);
    }

    // Apply vertical velocity and check for collisions
    this.y += this.vy * dt;
    let groundPlatform = null;
    if (level) {
        const potentialColliders = level.grid.query(this.x, this.y, this.width, this.height)
            .filter(obj => obj.type === 'platform');
        groundPlatform = this.handleVerticalCollision(potentialColliders, prevY);
    }

    // Update ground state
    this.onGround = !!groundPlatform;
    this.groundType = this.onGround ? groundPlatform.terrainType : null;
    this.isOnIce = this.groundType === 'ice';

    if (this.onGround) {
      this.jumpCount = 0;
      this.coyoteTimer = PLAYER_CONSTANTS.COYOTE_TIME;
    }

    // Level bounds and death plane
    if (level && this.y > level.height + 50) {
      if (!this.needsRespawn) {
        this.deathCount++;
        this.needsRespawn = true;
      }
    }
    this.x = Math.max(0, Math.min(this.x, level.width - this.width));
  }

  _updateTimers(dt) {
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
  }

  _determineState() {
    if (this.isDespawning) { this.state = 'despawn'; return; }
    if (this.isSpawning) { this.state = 'spawn'; return; }
    if (this.isDashing) { this.state = 'dash'; return; }
    
    // Exit cling state if not against a wall or if on the ground
    if (this.state === 'cling' && (!this.isAgainstWall || this.onGround)) {
      this.state = 'fall';
    }
    
    if (!this.onGround && this.state !== 'cling') {
      if (this.vy < 0) this.state = this.jumpCount === 2 ? 'double_jump' : 'jump';
      else this.state = 'fall';
      return;
    }

    if (this.onGround) {
      this.state = Math.abs(this.vx) < 1 ? 'idle' : 'run';
    }
  }

  _updateAnimation(dt, prevState) {
    if (this.state !== prevState) {
      this.animationFrame = 0;
      this.animationTimer = 0;
    }

    this.animationTimer += dt;
    const speed = (this.state === 'spawn') 
        ? PLAYER_CONSTANTS.SPAWN_ANIMATION_SPEED 
        : PLAYER_CONSTANTS.ANIMATION_SPEED;

    if (this.animationTimer < speed) return;
    
    this.animationTimer -= speed;
    const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[this.state] || 1;
    this.animationFrame++;

    const isOneShot = this.state === 'spawn' || this.state === 'despawn';
    if (isOneShot) {
      if (this.animationFrame >= frameCount) {
        this.animationFrame = frameCount - 1; // Clamp to the last frame
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
      this.animationFrame %= frameCount; // Loop other animations
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
            this.soundEvents.push({ type: 'stopLoop', key: this.activeSurfaceSound });
        }
        if (requiredSound) {
            this.soundEvents.push({ type: 'playLoop', key: requiredSound });
        }
        this.activeSurfaceSound = requiredSound;
    }
  }
  
  getCenterX() { return this.x + this.width / 2; }
  getCenterY() { return this.y + this.height / 2; }
}