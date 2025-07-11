export class Player {
  constructor(x, y, assets) {
    this.x = x;
    this.y = y;
    this.width = 32;  // 32x32 sprite size
    this.height = 32;
    this.vx = 0; // x and y velocity
    this.vy = 0; 

    this.jumpCount = 2; // 2 at the start to disable jumping immediately after spawning
    this.jumpPressed = false;  // Tracks whether the jump key is currently down
    this.direction = 'right';
    this.state = 'idle';
    this.assets = assets;
    this.onGround = false;  // Track if player is on ground/platform

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
    this.animationSpeed = 0.05; // Time between frames (0.05 = 50ms)

    // Animation frame counts for each state (1 for static images)
    this.animationFrames = {
      idle: 11,
      run: 12,
      double_jump: 6,
      jump: 1,
      fall: 1,
      dash: 1,
      cling: 5,
    };
    
    // Physics constants
    this.moveSpeed = 200;     // px/s
    this.jumpForce = 400;     // upward velocity when jumping
    this.gravity = 1200;      // downward acceleration
    this.maxFallSpeed = 500;  // terminal velocity
    
    console.log('Player initialized at:', x, y);
  }

  handleInput(keys) {
    const prevState = this.state;  // Store previous state to reset animation on state change

    if (this.isDashing) return; // Skip inputs during dash
    
    // Horizontal movement
    if (keys['a'] || keys['arrowleft']) {
      this.vx = -this.moveSpeed;
      this.direction = 'left';
      if (this.onGround) {
        this.state = 'run';
      }

    } else if (keys['d'] || keys['arrowright']) {
      this.vx = this.moveSpeed;
      this.direction = 'right';
      if (this.onGround) {
        this.state = 'run';
      }

    } else {
      this.vx = 0;
      if (this.onGround) {
        this.state = 'idle';
      }
    }

    // Detect new jump press
    const jumpKeyDown = keys['w'] || keys['arrowup'];

    if (jumpKeyDown && !this.jumpPressed) {
      if (this.jumpCount === 0) {
        this.vy = -this.jumpForce;
        this.jumpCount++;
        this.state = 'jump';
        this.onGround = false;
      } else if (this.jumpCount === 1) {
        this.vy = -this.jumpForce;
        this.jumpCount++;
        if (this.state !== 'double_jump') this.state = 'double_jump';
      }
      this.jumpPressed = true;
    }

    if (!jumpKeyDown) {
      this.jumpPressed = false; // Reset when key is released
    }

    const dashKeyDown = keys[' '];  // Dash input handling

    // Detect "just pressed" dash input
    if (dashKeyDown && !this.dashPressed && !this.isDashing && this.dashCooldownTimer <= 0) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.vx = this.direction === 'right' ? this.dashSpeed : -this.dashSpeed;
      this.vy = 0;
      this.state = 'dash';
      this.animationFrame = 0; // Reset to first frame
    }

    this.dashPressed = dashKeyDown; // Update flag for edge detection

    if (this.state !== prevState) {
      this.animationFrame = 0;
      this.animationTimer = 0;
    }
  }

  update(dt, canvasHeight, level = null) {
    try {
      // Store previous position for collision resolution
      const prevX = this.x;
      const prevY = this.y;
      
      // Update dash cooldown timer
      if (this.dashCooldownTimer > 0) {
        this.dashCooldownTimer -= dt;
        if (this.dashCooldownTimer < 0) this.dashCooldownTimer = 0;
      }

      // Handle dash logic
      if (this.isDashing) {
        this.state = 'dash';
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) {
          this.isDashing = false;
          this.vx = 0;

          // Start cooldown
          this.dashCooldownTimer = this.dashCooldown;

          // Restore appropriate state
          if (this.onGround) {
            this.state = 'idle';
          } else if (this.vy > 0) {
            this.state = 'fall';
          } else {
            this.state = 'jump';
          }
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
      if (this.state === 'cling') {
        let stillTouchingWall = false;
        for (const platform of level.platforms) {
          const nearLeft = Math.abs((this.x + this.width) - platform.x) < 2;
          const nearRight = Math.abs(this.x - (platform.x + platform.width)) < 2;
          const verticallyAligned = this.y + this.height > platform.y && this.y < platform.y + platform.height;
          if (verticallyAligned && (nearLeft || nearRight)) {
            stillTouchingWall = true;
            break;
          }
        }

        if (!stillTouchingWall) {
          this.state = 'fall';
        }
      }

      // Fallback ground collision with canvas bottom
      if (this.y > canvasHeight + 100) {
        if (level?.startPosition) {
          this.respawn(level.startPosition);
          return;
        }
      }

      // Update onGround status
      if (!groundCollision) this.onGround = false;

      // Update state based on movement and ground status
      if (!this.isDashing) {
        if (this.onGround) {
          if (this.vx !== 0) {
            this.state = 'run';
          } else {
            this.state = 'idle';
          }
        } else {
          // Avoid overriding cling state
          if (this.state !== 'cling') {
            if (this.vy > 0) {
              this.state = 'fall';
            } else if (this.jumpCount === 2) {
              this.state = 'double_jump';
            } else if (this.jumpCount === 1) {
              this.state = 'jump';
            }
          }
        }
      }

      // Wall boundaries with proper collision
      if (this.x < 0) {
        this.x = 0;
        this.vx = 0;
      }
      if (this.x + this.width > 1280) {
        this.x = 1280 - this.width;
        this.vx = 0;
      }

      // Update animation timer and frame
      this.animationTimer += dt;
      if (this.animationTimer >= this.animationSpeed) {
        this.animationTimer = 0;
        
        // Get the frame count for current state
        const frameCount = this.animationFrames[this.state] || 1;
        this.animationFrame = (this.animationFrame + 1) % frameCount;
      }

    } catch (error) {
      console.error('Error in player update:', error);
    }
  }

  respawn(startPosition) { // Resets the player to the spawn point
    this.x = startPosition.x;
    this.y = startPosition.y;
    this.vx = 0;
    this.vy = 0;
    this.jumpCount = 2;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.isDashing = false;
    this.state = 'idle';
    this.onGround = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
  }

  handleHorizontalCollision(level, prevX) {
    for (const platform of level.platforms) {
      if (this.isCollidingWith(platform)) {
        const fromLeft = prevX + this.width <= platform.x;
        const fromRight = prevX >= platform.x + platform.width;

        if (fromLeft) {
          this.x = platform.x - this.width;
          this.vx = 0;
        } else if (fromRight) {
          this.x = platform.x + platform.width;
          this.vx = 0;
        }

        // Wall cling check — only if airborne and falling
        if (!this.onGround && this.vy > 0) {
          this.state = 'cling';
          this.vy = 30; // Slow fall while clinging, change if wanted
          this.jumpCount = 1; // Allow a double jump off the wall
        }

        break;
      }
    }
  }

  handleVerticalCollision(level, prevY) {
    let groundCollision = false;
    for (const platform of level.platforms) {
      if (this.isCollidingWith(platform)) {
        // Determine if we hit from top or bottom
        if (prevY <= platform.y + platform.height && this.vy > 0) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.jumpCount = 0;
          this.onGround = true;
          groundCollision = true;
          break;

        } else if (prevY >= platform.y + platform.height && this.vy < 0) {
          this.y = platform.y + platform.height;
          this.vy = 0;
          break;
        }
      }
    }
    return groundCollision;
  }

  isCollidingWith(platform) {
    return this.x < platform.x + platform.width &&
           this.x + this.width > platform.x &&
           this.y < platform.y + platform.height &&
           this.y + this.height > platform.y;
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

      // Save context for transformations
      ctx.save();

      // Flip sprite horizontally if facing left
      if (this.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-(this.x + this.width), this.y);
      } else {
        ctx.translate(this.x, this.y);
      }

      // Draw the specific frame from the sprite sheet
      let drawOffsetX = 0;
      const clingOffset = 2.5; // adjust as needed
      if (this.state === 'cling') {
        drawOffsetX = this.direction === 'right' ? clingOffset : -clingOffset;
      }

      ctx.drawImage(
        sprite,                    // source image
        srcX, srcY,               // source x, y (frame position)
        frameWidth, frameHeight,   // source width, height
        drawOffsetX, 0,                     // destination x, y (relative to translation)
        this.width, this.height   // destination width, height
      );

      // Restore context
      ctx.restore();

    } catch (error) {
      console.error('Error rendering player:', error);
      this.renderFallback(ctx);
    }
  }

  getSpriteKey() {
    // Return appropriate sprite key based on current state
    switch (this.state) {
      case 'jump':
        return 'playerJump';
      case 'double_jump':
        return 'playerDoubleJump';
      case 'fall':
        return 'playerFall';
      case 'run':
        return 'playerRun';
      case 'dash':
        return 'playerDash';
      case 'cling':
        return 'playerCling';
      case 'idle':
      default:
        return 'playerIdle';
    }
  }

  renderFallback(ctx) {
    // Fallback rendering when sprites aren't available
    ctx.fillStyle = '#FF6B35'; // Orange color
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw a simple face
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x + 8, this.y + 8, 4, 4);   // Left eye
    ctx.fillRect(this.x + 20, this.y + 8, 4, 4);  // Right eye
    ctx.fillRect(this.x + 12, this.y + 20, 8, 2); // Mouth
    
    // Draw direction indicator
    ctx.fillStyle = 'red';
    if (this.direction === 'right') {
      ctx.fillRect(this.x + this.width - 2, this.y + this.height / 2 - 2, 4, 4);
    } else {
      ctx.fillRect(this.x - 2, this.y + this.height / 2 - 2, 4, 4);
    }
  }

  // Helper method to get player center point
  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}