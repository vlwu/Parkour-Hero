export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.width = canvasWidth;
    this.height = canvasHeight;
    
    // Level boundaries - will be set by updateLevelBounds
    this.levelWidth = canvasWidth;
    this.levelHeight = canvasHeight;
    
    // Camera follow settings
    this.followSpeed = 5; // How fast camera catches up to player (higher = faster)
    this.deadZone = {
      x: canvasWidth * 0.3,  // 30% of screen width
      y: canvasHeight * 0.3  // 30% of screen height
    };
    
    // Camera limits - prevent showing areas outside the level
    this.minX = 0;
    this.maxX = 0; // Will be calculated in updateLevelBounds
    this.minY = 0;
    this.maxY = 0; // Will be calculated in updateLevelBounds
    
    // Shake effect properties
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.shakeInitialIntensity = 0;
    this.shakeDuration = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    
    // Smooth movement
    this.targetX = 0;
    this.targetY = 0;
    
    console.log('Camera initialized:', {
      viewport: `${canvasWidth}x${canvasHeight}`
    });
  }

  // Update camera position to follow the player
  update(player, deltaTime) {
    // Calculate the center of the screen in world coordinates
    const screenCenterX = this.x + this.width / 2;
    const screenCenterY = this.y + this.height / 2;
    
    // Calculate player center
    const playerCenterX = player.getCenterX();
    const playerCenterY = player.getCenterY();
    
    // Calculate distance from screen center to player
    const distanceX = playerCenterX - screenCenterX;
    const distanceY = playerCenterY - screenCenterY;
    
    // Only move camera if player is outside the dead zone
    let moveX = 0;
    let moveY = 0;
    
    // Horizontal movement
    if (Math.abs(distanceX) > this.deadZone.x) {
      if (distanceX > 0) {
        moveX = distanceX - this.deadZone.x; // Player is to the right
      } else {
        moveX = distanceX + this.deadZone.x; // Player is to the left
      }
    }
    
    // Vertical movement
    if (Math.abs(distanceY) > this.deadZone.y) {
      if (distanceY > 0) {
        moveY = distanceY - this.deadZone.y; // Player is below
      } else {
        moveY = distanceY + this.deadZone.y; // Player is above
      }
    }
    
    // Apply smooth camera movement
    this.targetX = this.x + moveX;
    this.targetY = this.y + moveY;
    
    // Smoothly interpolate to target position
    this.x += (this.targetX - this.x) * this.followSpeed * deltaTime;
    this.y += (this.targetY - this.y) * this.followSpeed * deltaTime;
    
    // Apply camera bounds to prevent showing outside the level
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    
    // Update shake effect
    this.updateShake(deltaTime);
  }

  // Update screen shake effect
  updateShake(deltaTime) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      
      // Generate random shake offset
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      
      // Gradually reduce shake intensity based on time, not frame rate
      const decayRate = this.shakeInitialIntensity / this.shakeDuration;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - decayRate * deltaTime);
      
      if (this.shakeTimer <= 0) {
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
      }
    }
  }

  // Start a screen shake effect
  shake(intensity = 10, duration = 0.3) {
    this.shakeTimer = duration;
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
    this.shakeInitialIntensity = intensity;
  }

  // Apply camera transformation to the rendering context
  apply(ctx) {
    ctx.save();
    ctx.translate(
      -Math.round(this.x + this.shakeX), 
      -Math.round(this.y + this.shakeY)
    );
  }

  // Restore the rendering context
  restore(ctx) {
    ctx.restore();
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    };
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    };
  }

  // Check if a world position is visible on screen
  isVisible(worldX, worldY, width = 0, height = 0) {
    return (
      worldX + width > this.x &&
      worldX < this.x + this.width &&
      worldY + height > this.y &&
      worldY < this.y + this.height
    );
  }

  // Check if a rectangle is visible on screen
  isRectVisible(rect) {
    return this.isVisible(rect.x, rect.y, rect.width, rect.height);
  }

  // Center camera on a specific world position
  centerOn(worldX, worldY) {
    this.x = worldX - this.width / 2;
    this.y = worldY - this.height / 2;
    
    // Apply bounds
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    
    // Update targets to prevent smooth movement
    this.targetX = this.x;
    this.targetY = this.y;
  }

  // Immediately snap to player position (useful for level transitions)
  snapToPlayer(player) {
    this.centerOn(player.getCenterX(), player.getCenterY());
  }

  // Update camera bounds when level changes
  updateLevelBounds(levelWidth, levelHeight) {
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
    this.maxX = Math.max(0, levelWidth - this.width);
    this.maxY = Math.max(0, levelHeight - this.height);
    
    // Re-apply bounds to current position
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
  }

  // Set camera follow speed (higher = more responsive)
  setFollowSpeed(speed) {
    this.followSpeed = Math.max(0.1, speed);
  }

  // Set the dead zone size (area where player can move without camera following)
  setDeadZone(xPercent, yPercent) {
    this.deadZone.x = this.width * Math.max(0, Math.min(0.5, xPercent));
    this.deadZone.y = this.height * Math.max(0, Math.min(0.5, yPercent));
  }

  // Get camera bounds for debugging
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2
    };
  }

  // Draw debug information (call after drawing everything else)
  drawDebug(ctx) {
    // Save context
    ctx.save();
    
    // Don't apply camera transform for debug UI
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw dead zone
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.width / 2 - this.deadZone.x,
      this.height / 2 - this.deadZone.y,
      this.deadZone.x * 2,
      this.deadZone.y * 2
    );
    
    // Draw camera info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, this.height - 100, 200, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(`Camera: ${Math.round(this.x)}, ${Math.round(this.y)}`, 15, this.height - 80);
    ctx.fillText(`Target: ${Math.round(this.targetX)}, ${Math.round(this.targetY)}`, 15, this.height - 65);
    ctx.fillText(`Shake: ${Math.round(this.shakeX)}, ${Math.round(this.shakeY)}`, 15, this.height - 50);
    ctx.fillText(`Bounds: ${this.maxX}x${this.maxY}`, 15, this.height - 35);
    
    ctx.restore();
  }
}