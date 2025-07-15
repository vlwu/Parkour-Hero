export class Player {
  constructor(x, y, assets) {
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

    this.jumpCount = 2; // 2 at the start to disable jumping immediately after spawning
    this.jumpPressed = false; 
    this.direction = 'right';
    this.state = 'idle';
    this.assets = assets;
    this.onGround = false;  

    this.isSpawning = true;
    this.spawnComplete = false;

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
    if (this.isDashing) return; 
    
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

    // Detect new jump press
    const jumpKeyDown = inputActions.jump; // Use the action directly

    // Fast jump edge detection
    if (jumpKeyDown && !this.jumpPressed) {
      if (this.jumpCount < 2) { // Allow up to 2 jumps
      this.vy = -this.jumpForce; // Apply jump velocity
      this.jumpCount++;
      this.state = this.jumpCount === 2 ? 'double_jump' : 'jump'; // Set state
      this.onGround = false;
      }
      this.jumpPressed = true; // Mark jump as handled
    }

    if (!jumpKeyDown) {
      this.jumpPressed = false; // Reset when key is released
    }

    const dashKeyDown = inputActions.dash;  // Dash input handling

    // Dash: fast edge detection, cooldown, minimal branching
    if (dashKeyDown && !this.dashPressed && !this.isDashing && this.dashCooldownTimer <= 0) {
      this.isDashing = true;                  // Start dash
      this.dashTimer = this.dashDuration;     // Set dash timer
      this.vx = this.direction === 'right' ? this.dashSpeed : -this.dashSpeed; // Set dash velocity
      this.vy = 0;                            // No vertical movement during dash
      this.state = 'dash';                    // Set state for animation
      this.animationFrame = 0;                // Reset animation frame
    }

    this.dashPressed = dashKeyDown; // Update flag for edge detection

    // Fast animation reset on state change (minimize property writes)
    if (this.state !== prevState) {
      this.animationFrame = 0;   // Reset frame
      this.animationTimer = 0;   // Reset timer
    }
  }

  // <<< FIX: Removed canvasHeight from the signature
  update(dt, level = null) {
    try {
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

      // Store previous position for collision resolution
      const prevX = this.x;
      const prevY = this.y;
      
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

      // Apply gravity only when not dashing (dash is perfectly horizontal)
      if (!this.isDashing) this.vy += this.gravity * dt;
      
      // Cap falling speed to prevent going too fast
      if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

      // Update horizontal position
      this.x += this.vx * dt;
      
      // Handle horizontal collision with platforms
      if (level) this.handleHorizontalCollision(level, prevX);

      // Update vertical position
      this.y += this.vy * dt;
      
      // Handle vertical collision with platforms
      let groundCollision = false;
      if (level) groundCollision = this.handleVerticalCollision(level, prevY);

      // If clinging but no longer touching a wall, exit cling
      // Fast wall cling exit: check if still touching wall
      if (this.state === 'cling') {
        let touchingWall = false;
        for (let i = 0, len = level.platforms.length; i < len; i++) {
          const p = level.platforms[i];
          // Check vertical overlap
          if (this.y + this.height > p.y && this.y < p.y + p.height) {
        // Check near left/right edge (within 2px)
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

      if (!groundCollision) this.onGround = false; // Update onGround status

      // Handle spawn animation first
      if (!this.isDashing && this.onGround) {
        this.jumpCount = 0;
        this.usedDoubleJump = false;
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

      // Wall boundaries
      // Clamp player X position within [0, level.width - width]
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
        
        // Get the frame count for current state
        const frameCount = this.animationFrames[this.state] || 1;
        this.animationFrame = (this.animationFrame + 1) % frameCount;
      }

    } catch (error) {
      console.error('Error in player update:', error);
    }
  }

  respawn(startPosition) {
    this.x = startPosition.x;
    this.y = startPosition.y;
    this.vx = this.vy = 0;
    this.jumpCount = 2;
    this.jumpPressed = false;
    this.onGround = false;
    this.isDashing = false;
    this.dashTimer = this.dashCooldownTimer = 0;
    this.state = 'spawn';
    this.animationFrame = this.animationTimer = 0;
    this.needsRespawn = false;
    this.isSpawning = true;
    this.spawnComplete = false;
  }

  // Handles horizontal collision with platforms and wall cling logic
  handleHorizontalCollision(level, prevX) {
    const px = this.x, py = this.y, pw = this.width, ph = this.height;
    for (let i = 0, len = level.platforms.length; i < len; i++) {
      const platform = level.platforms[i];
      // Early exit for non-overlapping cases (AABB)
      if (
        px + pw <= platform.x ||
        px >= platform.x + platform.width ||
        py + ph <= platform.y ||
        py >= platform.y + platform.height
      ) continue;

      const fromLeft = prevX + pw <= platform.x;
      const fromRight = prevX >= platform.x + platform.width;

      if (fromLeft) {
        this.x = platform.x - pw;
        this.vx = 0;
      } else if (fromRight) {
        this.x = platform.x + platform.width;
        this.vx = 0;
      }

      // Wall cling only if airborne and falling
      if (!this.onGround && this.vy >= 0 && (fromLeft || fromRight)) {
        this.state = 'cling';
        this.vy = 30;        
        this.jumpCount = 1;  
      }

      break;
    }
  }

  // Handles vertical collision with platforms and updates ground status
  handleVerticalCollision(level, prevY) {
    let groundCollision = false;

    // Iterate platforms for collision detection
    for (const platform of level.platforms) {
      if (!this.isCollidingWith(platform)) continue;

      // Check if player is falling and hits the top of the platform
      const groundTolerance = 1; // 1 pixel tolerance
      const hitFromAbove = prevY + this.height <= platform.y + groundTolerance && this.vy >= 0;
      // Check if player is jumping and hits the bottom of the platform
      const hitFromBelow = prevY >= platform.y + platform.height && this.vy < 0;

      if (hitFromAbove) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.jumpCount = 0;
        this.onGround = true;
        groundCollision = true;
        break; 

      } else if (hitFromBelow) {
        this.y = platform.y + platform.height;
        this.vy = 0;
        break;
      }
    }

    return groundCollision;
  }

  isCollidingWith(platform) {
    const px = platform.x, py = platform.y, pw = platform.width, ph = platform.height;
    const x = this.x, y = this.y, w = this.width, h = this.height;
    
    if (x + w <= px || x >= px + pw || y + h <= py || y >= py + ph) return false; // Early exit for non-overlapping cases
    return true;
  }

  render(ctx) {
    try {
      // Get the appropriate sprite based on current state
      const spriteKey = this.getSpriteKey();
      const sprite = this.assets[spriteKey];
      
      // Fallback rendering if sprite not available
      if (!sprite) {
        console.warn(`Sprite ${spriteKey} not loaded, using fallback`);
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

      // Use spawn size during spawn animation, normal size otherwise
      const renderWidth = (this.state === 'spawn') ? this.spawnWidth : this.width;
      const renderHeight = (this.state === 'spawn') ? this.spawnHeight : this.height;

      // Adjust position to center the larger spawn sprite
      const renderX = (this.state === 'spawn') ? -(this.spawnWidth - this.width) / 2 : 0;
      const renderY = (this.state === 'spawn') ? -(this.spawnHeight - this.height) / 2 : 0;

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