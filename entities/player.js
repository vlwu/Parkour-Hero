export class Player {
  constructor(x, y, assets) {
    this.x = x;
    this.y = y;
    this.width = 32;  // 32x32 sprite size
    this.height = 32;
    this.vx = 0; // x and y velocity
    this.vy = 0; 

    this.jumpCount = 0;
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
      dash: 1
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
      if (!this.isDashing) {
        this.vy += this.gravity * dt;
      }
      
      // Cap falling speed to prevent going too fast
      if (this.vy > this.maxFallSpeed) {
        this.vy = this.maxFallSpeed;
      }

      // Update horizontal position
      this.x += this.vx * dt;
      
      // Handle horizontal collision with platforms
      if (level) {
        this.handleHorizontalCollision(level, prevX);
      }

      // Update vertical position
      this.y += this.vy * dt;
      
      // Handle vertical collision with platforms
      let groundCollision = false;
      if (level) {
        groundCollision = this.handleVerticalCollision(level, prevY);
      }

      // Fallback ground collision with canvas bottom
      if (!groundCollision && this.y + this.height > canvasHeight) {
        this.y = canvasHeight - this.height;
        this.vy = 0;
        this.jumpCount = 0;
        this.onGround = true;
        groundCollision = true;
      }

      // Update onGround status
      if (!groundCollision) {
        this.onGround = false;
      }

      // Update state based on movement and ground status
      if (!this.isDashing) {
        if (this.onGround) {
          if (this.vx !== 0) {
            this.state = 'run';
          } else {
            this.state = 'idle';
          }
        } else {
          // In air - update state based on vertical movement
          if (this.vy > 0) {
            this.state = 'fall';
          } else if (this.jumpCount === 2) {
            this.state = 'double_jump';
          } else if (this.jumpCount === 1) {
            this.state = 'jump';
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

  handleHorizontalCollision(level, prevX) {
    // Check collision with each platform
    for (const platform of level.platforms) {
      if (this.isCollidingWith(platform)) {
        // Determine which side we hit
        if (prevX + this.width <= platform.x) {
          // Hit left side of platform
          this.x = platform.x - this.width;
        } else if (prevX >= platform.x + platform.width) {
          // Hit right side of platform
          this.x = platform.x + platform.width;
        }
        
        // Stop horizontal movement
        this.vx = 0;
        break;
      }
    }
  }

  handleVerticalCollision(level, prevY) {
    let groundCollision = false;
    
    // Check collision with each platform
    for (const platform of level.platforms) {
      if (this.isCollidingWith(platform)) {
        // Determine if we hit from top or bottom
        if (prevY <= platform.y + platform.height && this.vy > 0) {
          // Landing on top of platform
          this.y = platform.y - this.height;
          this.vy = 0;
          this.jumpCount = 0;
          this.onGround = true;
          groundCollision = true;
          break;
        } else if (prevY >= platform.y + platform.height && this.vy < 0) {
          // Hit platform from below
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
      ctx.drawImage(
        sprite,                    // source image
        srcX, srcY,               // source x, y (frame position)
        frameWidth, frameHeight,   // source width, height
        0, 0,                     // destination x, y (relative to translation)
        this.width, this.height   // destination width, height
      );

      // Restore context
      ctx.restore();

      // Debug info (optional - remove in production)
      if (false) { // Set to true for debugging
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(`State: ${this.state}`, this.x, this.y - 5);
        ctx.fillText(`Frame: ${this.animationFrame}/${this.animationFrames[this.state]}`, this.x, this.y - 20);
        ctx.fillText(`Vel: ${Math.round(this.vx)},${Math.round(this.vy)}`, this.x, this.y - 35);
        ctx.fillText(`OnGround: ${this.onGround}`, this.x, this.y - 50);
      }

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

  // Helper method to get player bounds for collision detection
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
}