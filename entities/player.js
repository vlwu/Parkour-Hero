export class Player {
  constructor(x, y, assets, characterId) {
    this.x = x;
    this.y = y;
    this.width = 32;  // 32x32 sprite size
    this.height = 32;
    this.spawnWidth = 96;   // Spawn animation size
    this.spawnHeight = 96;

    this.vx = 0; // x and y velocity
    this.vy = 0;
    this.needsRespawn = false;
    this.deathCount = 0; // Track number of deaths

    this.jumpCount = 0;
    this.jumpPressed = false;
    this.direction = 'right';
    this.state = 'idle';
    this.assets = assets;
    this.characterId = characterId || 'PinkMan';
    this.onGround = false;

    this.isSpawning = true;
    this.spawnComplete = false;
    this.isDespawning = false;
    this.despawnAnimationFinished = false;

    this.jumpedThisFrame = 0; // 0: no, 1: first jump, 2: double jump

    // Coyote time and jump buffer properties
    this.coyoteTime = 0.1; // 100ms of coyote time
    this.coyoteTimer = 0;
    this.jumpBufferTime = 0.15; // 150ms buffer for jump input
    this.jumpBufferTimer = 0;

    // Dash properties
    this.isDashing = false;
    this.dashDuration = 0.2;
    this.dashTimer = 0;        // Timer for how long dash has been going
    this.dashSpeed = 500;      // Dash velocity in px/s
    this.dashCooldown = 0.5;
    this.dashCooldownTimer = 0;  // Timer tracking cooldown
    this.dashPressed = false;    // Prevent holding down dash key
    
    // Animation properties
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 0.05; // in s
    this.spawnAnimationSpeed = 0.08;
    
    // Animation frame counts for each state (1 for static images)
    this.animationFrames = {
      idle: 11,
      run: 12,
      double_jump: 6,
      jump: 1,
      fall: 1,
      dash: 1,
      cling: 5,
      spawn: 7,
      despawn: 7,
    };
    
    // Physics constants
    this.moveSpeed = 200;     // px/s
    this.jumpForce = 400;     // upward velocity when jumping
    this.gravity = 1200;      // downward acceleration
    this.maxFallSpeed = 500;  // terminal velocity
    
    console.log('Player initialized at:', x, y);
  }

  // Modified to accept an object of active actions
  handleInput(inputActions) {
    const prevState = this.state;  // Store previous state to reset animation on state change

    // Skip input handling depending on state
    if (this.isSpawning && !this.spawnComplete) return;
    if (this.isDashing || this.isDespawning) return;
    
    // Horizontal movement
    if (inputActions.moveLeft) {
      this.vx = -this.moveSpeed;
      this.direction = 'left';
      if (this.onGround) this.state = 'run'; // Only set state if grounded
    } else if (inputActions.moveRight) {
      this.vx = this.moveSpeed;
      this.direction = 'right';
      if (this.onGround) this.state = 'run';
    } else {
      this.vx = 0;
      if (this.onGround) this.state = 'idle';
    }

    const jumpKeyDown = inputActions.jump;

    // Buffer jump input. Allows for holding jump to execute on landing.
    if (jumpKeyDown) {
      this.jumpBufferTimer = this.jumpBufferTime;
    }

    // Double jump requires a new, distinct press while airborne.
    if (jumpKeyDown && !this.jumpPressed && this.jumpCount === 1 && !this.onGround) {
        this.vy = -this.jumpForce;
        this.jumpCount = 2;
        this.state = 'double_jump';
        this.animationFrame = 0; // Reset animation for double jump
        this.jumpBufferTimer = 0; // Consume buffer on double jump
        this.jumpedThisFrame = 2; // Mark as double jump
    }

    this.jumpPressed = jumpKeyDown; 

    const dashKeyDown = inputActions.dash; 

    // Dash logic
    if (dashKeyDown && !this.dashPressed && !this.isDashing && this.dashCooldownTimer <= 0) {
      this.isDashing = true;                 
      this.dashTimer = this.dashDuration;     
      this.vx = this.direction === 'right' ? this.dashSpeed : -this.dashSpeed; 
      this.vy = 0;                            
      this.state = 'dash';                    
      this.animationFrame = 0;               
    }

    this.dashPressed = dashKeyDown; // Update flag for edge detection

    // Fast animation reset on state change
    if (this.state !== prevState) {
      this.animationFrame = 0;   
      this.animationTimer = 0;   
    }
  }

  update(dt, level = null) {
    try {
      // Update timers for coyote time and jump buffer
      if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
      if (!this.onGround && this.coyoteTimer > 0) {
          this.coyoteTimer -= dt;
      }

      if (this.isSpawning && !this.spawnComplete) {
        // Only update animation timer and frame during spawn
        this.animationTimer += dt;
        if (this.animationTimer >= this.spawnAnimationSpeed) {
          this.animationTimer = 0;
          this.animationFrame++;
          // Check if spawn animation is complete
          if (this.animationFrame >= this.animationFrames['spawn']) {
            this.spawnComplete = true;
            this.isSpawning = false;
            this.state = 'idle';
            this.animationFrame = 0; // Reset for idle state
          }
        }
        return;
      }

      if (this.isDespawning) {
        this.animationTimer += dt;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.animationFrame++;
            if (this.animationFrame >= this.animationFrames.despawn) {
                this.despawnAnimationFinished = true;
                this.isDespawning = false; // Stop further updates
            }
        }
        return; // No other logic while despawning
      }
      
      // Get a filtered list of platforms that are close to the player
      let nearbyPlatforms = level.platforms;
      if (level) {
          const checkRadius = 200; // Check for platforms within 200px
          nearbyPlatforms = level.platforms.filter(p =>
              Math.abs(p.x - this.x) < checkRadius + p.width &&
              Math.abs(p.y - this.y) < checkRadius + p.height
          );
      }
      
      // Dash cooldown timer (fast, single branch)
      if (this.dashCooldownTimer > 0) {
        this.dashCooldownTimer -= dt;
        if (this.dashCooldownTimer <= 0) this.dashCooldownTimer = 0; // Clamp to zero
      }

      // Dash logic
      if (this.isDashing) {
        this.state = 'dash';
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) {
          this.isDashing = false;
          this.vx = 0;
          this.dashCooldownTimer = this.dashCooldown; // Start cooldown
        }
      }

      // Handle buffered jump execution (first jump only)
      if (this.jumpBufferTimer > 0 && this.jumpCount === 0) {
        // Check for ground or coyote time
        if (this.onGround || this.coyoteTimer > 0) {
            this.vy = -this.jumpForce;
            this.jumpCount = 1;
            this.state = 'jump';
            this.onGround = false;
            this.jumpBufferTimer = 0; 
            this.coyoteTimer = 0; 
            this.jumpedThisFrame = 1; // Mark as first jump
        }
      }

      // Apply gravity
      if (!this.isDashing) this.vy += this.gravity * dt;
      if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

      // 1. Move and resolve horizontally
      this.x += this.vx * dt;
      if (level) this.handleHorizontalCollision(nearbyPlatforms);

      // 2. Move and resolve vertically
      this.y += this.vy * dt;
      let groundCollision = false;
      if (level) groundCollision = this.handleVerticalCollision(nearbyPlatforms);
      
      // If clinging but no longer touching a wall, exit cling
      if (this.state === 'cling') {
        let touchingWall = false;
        for (const p of nearbyPlatforms) {
          if (this.y + this.height > p.y && this.y < p.y + p.height) {
            if (
              Math.abs((this.x + this.width) - p.x) < 2 ||
              Math.abs(this.x - (p.x + p.width)) < 2
            ) {
              touchingWall = true;
              break;
            }
          }
        }
        if (!touchingWall) this.state = 'fall'; // Exit cling if not touching wall
      }

      // Check for falling out of the level boundaries
      if (level && this.y > level.height + 50) {
        if (!this.needsRespawn) {
          this.deathCount++;
          this.needsRespawn = true;
          return;
        }
      }
      
      // After vertical collision, if we are not on the ground, set onGround to false
      if (!groundCollision) this.onGround = false;

      // Update player state based on physics
      if (!this.isDashing && this.onGround) {
        this.jumpCount = 0;
        this.coyoteTimer = this.coyoteTime;
        this.state = this.vx !== 0 ? 'run' : 'idle';
      } else if (!this.isDashing && this.state !== 'cling') {
        // Airborne states
        if (this.vy > 0) {
          this.state = 'fall';
        } else if (this.jumpCount === 2) {
          this.state = 'double_jump';
        } else {
          this.state = 'jump';
        }
      }

      // Clamp player X position within level boundaries
      if (this.x < 0) {
        this.x = 0;
        this.vx = 0;
      } else if (level && this.x + this.width > level.width) {
        this.x = level.width - this.width;
        this.vx = 0;
      }

      // Update animation timer and frame
      this.animationTimer += dt;
      const currentAnimationSpeed = (this.state === 'spawn') ? this.spawnAnimationSpeed : this.animationSpeed;

      if (this.animationTimer >= currentAnimationSpeed) {
        this.animationTimer = 0;
        const frameCount = this.animationFrames[this.state] || 1;
        this.animationFrame = (this.animationFrame + 1) % frameCount;
      }

    } catch (error) {
      console.error('Error in player update:', error);
    }
  }

  startDespawn() {
    this.isDespawning = true;
    this.despawnAnimationFinished = false;
    this.state = 'despawn';
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.vx = 0;
    this.vy = 0;
  }

  respawn(startPosition) {
    this.x = startPosition.x;
    this.y = startPosition.y;
    this.vx = this.vy = 0;
    this.jumpCount = 0;
    this.jumpPressed = false;
    this.onGround = false;
    this.isDashing = false;
    this.dashTimer = this.dashCooldownTimer = 0;
    this.state = 'spawn';
    this.animationFrame = this.animationTimer = 0;
    this.needsRespawn = false;
    this.isSpawning = true;
    this.spawnComplete = false;
    this.isDespawning = false;
    this.despawnAnimationFinished = false;
  }

  // REFACTORED: Handles horizontal collision based on velocity.
  handleHorizontalCollision(platforms) {
    for (const platform of platforms) {
      if (!this.isCollidingWith(platform)) {
        continue;
      }
  
      let isWallCollision = false;
      // Player moving right collided with platform's left side
      if (this.vx > 0) {
        this.x = platform.x - this.width;
        isWallCollision = true;
      // Player moving left collided with platform's right side
      } else if (this.vx < 0) {
        this.x = platform.x + platform.width;
        isWallCollision = true;
      }
  
      // If a wall collision occurred, handle wall cling logic
      if (isWallCollision) {
        // Wall cling only if airborne and not moving up
        if (!this.onGround && this.vy >= 0) {
          this.state = 'cling';
          this.vy = 30;     // Slow slide down
          this.jumpCount = 1; // Allow wall jump
        }
        this.vx = 0; // Stop horizontal movement
        break; // Exit after resolving one collision
      }
    }
  }

  // REFACTORED: Handles vertical collision based on velocity.
  handleVerticalCollision(platforms) {
    let groundCollision = false;
  
    for (const platform of platforms) {
      if (!this.isCollidingWith(platform)) {
        continue;
      }
  
      // Player moving down (vy > 0) collided with platform top
      if (this.vy > 0) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
        groundCollision = true;
      // Player moving up (vy < 0) collided with platform bottom
      } else if (this.vy < 0) {
        this.y = platform.y + platform.height;
        this.vy = 0; // Hit ceiling, stop upward motion
      }
  
      // If any vertical collision was resolved, break the loop
      if (this.vy === 0) {
        break;
      }
    }
  
    return groundCollision;
  }

  isCollidingWith(platform) {
    const px = platform.x, py = platform.y, pw = platform.width, ph = platform.height;
    const x = this.x, y = this.y, w = this.width, h = this.height;
    
    // Early exit for non-overlapping cases
    if (x + w <= px || x >= px + pw || y + h <= py || y >= py + ph) return false;
    return true;
  }

  render(ctx) {
    try {
      if (this.despawnAnimationFinished) return; 
      
      const spriteKey = this.getSpriteKey();
      
      // Select the correct sprite: character-specific first, then global fallback.
      let sprite = this.assets.characters[this.characterId]?.[spriteKey];
      if (!sprite) {
        sprite = this.assets[spriteKey];
      }
      
      // Fallback rendering if sprite not available
      if (!sprite) {
        console.warn(`Sprite for ${spriteKey} (char: ${this.characterId}) not loaded, using fallback`);
        this.renderFallback(ctx);
        return;
      }

      // Calculate sprite sheet frame dimensions
      const frameCount = this.animationFrames[this.state] || 1;
      const frameWidth = sprite.width / frameCount;
      const frameHeight = sprite.height;
      
      // Calculate source position (which frame to draw)
      const srcX = frameWidth * this.animationFrame;
      const srcY = 0;

      ctx.save();

      // Flip sprite horizontally if facing left
      if (this.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-(this.x + this.width), this.y);
      } else {
        ctx.translate(this.x, this.y);
      }

      // Make it look like the player is touching the wall when clinging
      let drawOffsetX = 0;
      const clingOffset = 7;
      if (this.state === 'cling') {
        drawOffsetX = clingOffset;
      }

      // Use spawn size during spawn/despawn animation, normal size otherwise
      const isSpecialAnim = this.state === 'spawn' || this.state === 'despawn';
      const renderWidth = isSpecialAnim ? this.spawnWidth : this.width;
      const renderHeight = isSpecialAnim ? this.spawnHeight : this.height;

      // Adjust position to center the larger spawn sprite
      const renderX = isSpecialAnim ? -(this.spawnWidth - this.width) / 2 : 0;
      const renderY = isSpecialAnim ? -(this.spawnHeight - this.height) / 2 : 0;

      ctx.drawImage(
        sprite,
        srcX, srcY,
        frameWidth, frameHeight,
        drawOffsetX + renderX, renderY,
        renderWidth, renderHeight
      );

      // Restore context
      ctx.restore();

    } catch (error) {
      console.error('Error rendering player:', error);
      this.renderFallback(ctx);
    }
  }

  getSpriteKey() {
    // Map states to sprite keys for fast lookup
    const spriteMap = {
      jump: 'playerJump',
      double_jump: 'playerDoubleJump',
      fall: 'playerFall',
      run: 'playerRun',
      dash: 'playerDash',
      cling: 'playerCling',
      idle: 'playerIdle',
      spawn: 'playerAppear',
      despawn: 'playerDisappear',
    };
    return spriteMap[this.state] || 'playerIdle';
  }

  renderFallback(ctx) {
    // Fallback rendering when sprites aren't available
    ctx.fillStyle = '#FF6B35'; // Orange color
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw a simple face
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y, 4, 4);
    
    // Draw direction indicator
    ctx.fillStyle = 'red';
    if (this.direction === 'right') {
      ctx.fillRect(this.x + this.width - 2, this.y + this.height / 2 - 2, 4, 4);
    } else {
      ctx.fillRect(this.x - 2, this.y + this.height / 2 - 2, 4, 4);
    }
  }

  // Helper method to get player center point
  getCenterX() { return this.x + this.width / 2; }
  getCenterY() { return this.y + this.height / 2; }
}