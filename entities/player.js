export class Player {
  constructor(x, y, assets) {
    this.x = x;
    this.y = y;
    this.width = 32;  // Increased size to match sprite dimensions
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.jumpCount = 0;
    this.direction = 'right';
    this.state = 'idle';
    this.isJumping = false;
    this.assets = assets;
    
    // Animation properties
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 0.15; // Time between frames
    
    // Physics constants
    this.moveSpeed = 200;     // pixels per second
    this.jumpForce = 400;     // upward velocity when jumping
    this.gravity = 1200;      // downward acceleration
    this.maxFallSpeed = 500;  // terminal velocity
    
    console.log('Player initialized at:', x, y);
  }

  handleInput(keys) {
    // Horizontal movement
    if (keys['a'] || keys['arrowleft']) {
      this.vx = -this.moveSpeed;
      this.direction = 'left';
      if (!this.isJumping) {
        this.state = 'run';
      }
    } else if (keys['d'] || keys['arrowright']) {
      this.vx = this.moveSpeed;
      this.direction = 'right';
      if (!this.isJumping) {
        this.state = 'run';
      }
    } else {
      this.vx = 0;
      if (!this.isJumping) {
        this.state = 'idle';
      }
    }

    // Jumping (allow double jump)
    if ((keys['w'] || keys['arrowup'] || keys[' ']) && this.jumpCount < 2) {
      this.vy = -this.jumpForce;
      this.jumpCount++;
      this.isJumping = true;
      this.state = 'jump';
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
        this.isJumping = false;
        
        // Update state based on horizontal movement
        if (this.vx !== 0) {
          this.state = 'run';
        } else {
          this.state = 'idle';
        }
      }

      // Update state based on vertical movement
      if (this.vy > 0 && this.isJumping) {
        this.state = 'fall';
      } else if (this.vy < 0) {
        this.state = 'jump';
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

      // Update animation timer
      this.animationTimer += dt;
      if (this.animationTimer >= this.animationSpeed) {
        this.animationTimer = 0;
        this.animationFrame = (this.animationFrame + 1) % 4; // 4 frame cycle
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

      // Save context for transformations
      ctx.save();

      // Flip sprite horizontally if facing left
      if (this.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-(this.x + this.width), this.y);
      } else {
        ctx.translate(this.x, this.y);
      }

      // Draw the sprite
      ctx.drawImage(sprite, 0, 0, this.width, this.height);

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
        ctx.fillText(`Vel: ${Math.round(this.vx)},${Math.round(this.vy)}`, this.x, this.y - 20);
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
      case 'fall':
        return 'playerFall';
      case 'run':
        // For now, use jump sprite for running (you can add run sprites later)
        return 'playerJump';
      case 'idle':
      default:
        return 'playerJump'; // Default sprite
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