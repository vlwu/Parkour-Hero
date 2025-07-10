export class Player {
  constructor(x, y, assets) {
    this.x = x;
    this.y = y;
    this.width = 32;  // 32x32 sprite size
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.jumpCount = 0;
    this.direction = 'right';
    this.state = 'idle';
    this.assets = assets;
    
    // Animation properties
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 0.05; // Time between frames (0.05 = 50ms)

    // Animation frame counts for each state
    this.animationFrames = {
      idle: 11,        // 11 frames for idle
      run: 12,         // 12 frames for running
      double_jump: 6,         // 6 frames for double jump
      jump: 1,
      fall: 1          // 1 frame for falling (static)
    };
    
    // Physics constants
    this.moveSpeed = 200;     // pixels per second
    this.jumpForce = 400;     // upward velocity when jumping
    this.gravity = 1200;      // downward acceleration
    this.maxFallSpeed = 500;  // terminal velocity
    
    console.log('Player initialized at:', x, y);
  }

  handleInput(keys) {
    // Store previous state to reset animation on state change
    const prevState = this.state;
    
    // Horizontal movement
    if (keys['a'] || keys['arrowleft']) {
      this.vx = -this.moveSpeed;
      this.direction = 'left';
      if (this.jumpCount === 0) {
        this.state = 'run';
      }
    } else if (keys['d'] || keys['arrowright']) {
      this.vx = this.moveSpeed;
      this.direction = 'right';
      if (this.jumpCount === 0) {
        this.state = 'run';
      }
    } else {
      this.vx = 0;
      if (this.jumpCount === 0) {
        this.state = 'idle';
      }
    }

    // Jumping (allow double jump)
    if ((keys['w'] || keys['arrowup']) && this.jumpCount === 0) {
      this.vy = -this.jumpForce;
      this.jumpCount++;
      this.state = 'jump';
    } else if ((keys['w'] || keys['arrowup']) && this.jumpCount === 1) {
      // Allow double jump only if already jumped once
      this.vy = -this.jumpForce;
      this.jumpCount++;
      this.state = 'double_jump';
    }
    
    // Reset animation if state changed
    if (prevState !== this.state) {
      this.animationFrame = 0;
      this.animationTimer = 0;
    }
  }

  update(dt, canvasHeight) {
    try {
      // Update position based on velocity
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      
      // Apply gravity
      this.vy += this.gravity * dt;
      
      // Cap falling speed to prevent going too fast
      if (this.vy > this.maxFallSpeed) {
        this.vy = this.maxFallSpeed;
      }

      // Ground collision detection
      if (this.y + this.height > canvasHeight) {
        this.y = canvasHeight - this.height;
        this.vy = 0;
        this.jumpCount = 0;
        
        // Update state based on horizontal movement
        if (this.vx !== 0) {
          this.state = 'run';
        } else {
          this.state = 'idle';
        }
      }

      // Update state based on vertical movement
      if (this.vy > 0 && this.jumpCount > 0) {
        this.state = 'fall';
      } else if (this.vy < 0 && this.jumpCount === 1) {
        this.state = 'jump';
      } else if (this.jumpCount === 2) {
        this.state = 'double_jump';
      }
      // Wall boundaries with proper collision
      if (this.x < 0) {
        this.x = 0;
        this.vx = 0;
      }
      if (this.x + this.width > 1280) { // Canvas width
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

  render(ctx) {
    try {
      // Get the appropriate sprite based on current state
      let spriteKey = this.getSpriteKey();
      let sprite = this.assets[spriteKey];
      
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