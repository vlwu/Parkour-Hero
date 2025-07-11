// core/camera.js
export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Camera smoothing properties
    this.smoothing = 0.1;        // How quickly camera catches up (0.1 = 10% per frame)
    this.deadZone = 100;         // Dead zone around player where camera doesn't move
    this.maxSpeed = 300;         // Maximum camera movement speed (pixels/second)
    
    // Camera boundaries (set these based on your level size)
    this.minX = 0;
    this.maxX = 2000;            // Adjust based on your level width
    this.minY = -200;            // Allow some camera movement up
    this.maxY = 0;               // Don't go below ground level
    
    // Target position (where camera wants to be)
    this.targetX = 0;
    this.targetY = 0;
    
    // Shake effect properties
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }
  
  // Update camera position to follow the player
  follow(player, dt) {
    // Calculate where the camera should ideally be positioned
    // We want the player to be roughly in the center-left of the screen
    const idealX = player.x - (this.canvasWidth * 0.4);  // 40% from left edge
    const idealY = player.y - (this.canvasHeight * 0.6); // 60% from top
    
    // Calculate the difference between current and ideal positions
    const deltaX = idealX - this.x;
    const deltaY = idealY - this.y;
    
    // Dead zone logic - only move camera if player is outside the dead zone
    let moveX = 0;
    let moveY = 0;
    
    if (Math.abs(deltaX) > this.deadZone) {
      moveX = deltaX - (deltaX > 0 ? this.deadZone : -this.deadZone);
    }
    
    if (Math.abs(deltaY) > this.deadZone) {
      moveY = deltaY - (deltaY > 0 ? this.deadZone : -this.deadZone);
    }
    
    // Apply smoothing to camera movement
    const smoothedMoveX = moveX * this.smoothing;
    const smoothedMoveY = moveY * this.smoothing;
    
    // Limit camera movement speed
    const maxMoveX = this.maxSpeed * dt;
    const maxMoveY = this.maxSpeed * dt;
    
    const clampedMoveX = Math.max(-maxMoveX, Math.min(maxMoveX, smoothedMoveX));
    const clampedMoveY = Math.max(-maxMoveY, Math.min(maxMoveY, smoothedMoveY));
    
    // Update camera position
    this.x += clampedMoveX;
    this.y += clampedMoveY;
    
    // Apply camera boundaries
    this.x = Math.max(this.minX, Math.min(this.maxX - this.canvasWidth, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    
    // Update screen shake if active
    this.updateShake(dt);
  }
  
  // Apply camera transformation to the canvas context
  // Call this before rendering game objects
  applyTransform(ctx) {
    ctx.save();
    
    // Apply camera offset (negative because we're moving the world, not the camera)
    const finalX = -this.x + this.shakeOffsetX;
    const finalY = -this.y + this.shakeOffsetY;
    
    ctx.translate(finalX, finalY);
  }
  
  // Restore the canvas context transformation
  // Call this after rendering game objects
  restoreTransform(ctx) {
    ctx.restore();
  }
  
  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x + this.shakeOffsetX,
      y: worldY - this.y + this.shakeOffsetY
    };
  }
  
  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x - this.shakeOffsetX,
      y: screenY + this.y - this.shakeOffsetY
    };
  }
  
  // Check if a rectangle is visible in the camera view (for culling)
  isRectVisible(x, y, width, height) {
    const screenPos = this.worldToScreen(x, y);
    
    return screenPos.x + width > 0 &&
           screenPos.x < this.canvasWidth &&
           screenPos.y + height > 0 &&
           screenPos.y < this.canvasHeight;
  }
  
  // Trigger screen shake effect
  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }
  
  // Update screen shake effect
  updateShake(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      
      // Calculate shake intensity that decreases over time
      const currentIntensity = (this.shakeTimer / this.shakeDuration) * this.shakeIntensity;
      
      // Generate random shake offset
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      
      // Stop shaking when timer reaches zero
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }
  
  // Set camera boundaries based on level size
  setBoundaries(minX, maxX, minY, maxY) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }
  
  // Instantly snap camera to a position (useful for level transitions)
  snapTo(x, y) {
    this.x = x;
    this.y = y;
  }
  
  // Get camera bounds for optimization purposes
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.canvasWidth,
      top: this.y,
      bottom: this.y + this.canvasHeight
    };
  }
}