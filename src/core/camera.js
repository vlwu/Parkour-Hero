import { PositionComponent } from "../components/PositionComponent.js";
import { CollisionComponent } from "../components/CollisionComponent.js";

export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.zoom = 1.8;
    this.viewportWidth = canvasWidth;
    this.viewportHeight = canvasHeight;


    this.width = this.viewportWidth / this.zoom;
    this.height = this.viewportHeight / this.zoom;


    this.levelWidth = this.width;
    this.levelHeight = this.height;


    this.followSpeed = 5;


    this.deadZone = {
      x: this.width * 0.2,
      y: this.height * 0.2
    };


    this.minX = 0;
    this.maxX = 0;
    this.minY = 0;
    this.maxY = 0;


    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.shakeInitialIntensity = 0;
    this.shakeDuration = 0;
    this.shakeX = 0;
    this.shakeY = 0;


    this.targetX = 0;
    this.targetY = 0;


    this.prevX = 0;
    this.prevY = 0;


    this.projectionMatrix = new Float32Array(16);

    console.log('Camera initialized:', {
      viewport: `${this.viewportWidth}x${this.viewportHeight}`,
      zoom: this.zoom,
      worldView: `${this.width}x${this.height}`
    });
  }

  update(entityManager, playerEntityId, deltaTime) {

    this.prevX = this.x;
    this.prevY = this.y;

    if (playerEntityId !== null) {
      const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
      const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);
      if (playerPos && playerCol) {
        const cameraCenterX = this.x + this.width / 2;
        const cameraCenterY = this.y + this.height / 2;

        const playerCenterX = playerPos.x + playerCol.width / 2;
        const playerCenterY = playerPos.y + playerCol.height / 2;

        const distanceX = playerCenterX - cameraCenterX;
        const distanceY = playerCenterY - cameraCenterY;

        let moveX = 0;
        let moveY = 0;

        if (Math.abs(distanceX) > this.deadZone.x) {
          moveX = distanceX > 0 ? distanceX - this.deadZone.x : distanceX + this.deadZone.x;
        }

        if (Math.abs(distanceY) > this.deadZone.y) {
          moveY = distanceY > 0 ? distanceY - this.deadZone.y : distanceY + this.deadZone.y;
        }

        this.targetX = this.x + moveX;
        this.targetY = this.y + moveY;

        this.x += (this.targetX - this.x) * this.followSpeed * deltaTime;
        this.y += (this.targetY - this.y) * this.followSpeed * deltaTime;

        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
        this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
      }
    }

    if (deltaTime > 0) {
        this.updateShake(deltaTime);
    } else {
        this.shakeX = 0;
        this.shakeY = 0;
    }
  }

  updateShake(deltaTime) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;

      const decayRate = this.shakeInitialIntensity / this.shakeDuration;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - decayRate * deltaTime);

      if (this.shakeTimer <= 0) {
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
      }
    }
  }

  shake(intensity = 10, duration = 0.3) {
    this.shakeTimer = duration;
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
    this.shakeInitialIntensity = intensity;
  }

  apply(ctx, alpha = 1.0) {
    ctx.save();
    const renderX = this.prevX + (this.x - this.prevX) * alpha;
    const renderY = this.prevY + (this.y - this.prevY) * alpha;
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(
      -Math.round(renderX + this.shakeX),
      -Math.round(renderY + this.shakeY)
    );
  }

  restore(ctx) {
    ctx.restore();
  }

  snapToPlayer(entityManager, playerEntityId) {
    if (playerEntityId === null) return;
    const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
    const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);
    if (!playerPos || !playerCol) return;

    this.centerOn(playerPos.x + playerCol.width / 2, playerPos.y + playerCol.height / 2);
  }

  centerOn(worldX, worldY) {
    this.x = worldX - this.width / 2;
    this.y = worldY - this.height / 2;
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    this.targetX = this.x;
    this.targetY = this.y;

    this.prevX = this.x;
    this.prevY = this.y;
  }

  getViewportBounds() {
    const buffer = 32;
    return {
      x: this.x - buffer,
      y: this.y - buffer,
      width: this.width + buffer * 2,
      height: this.height + buffer * 2,
    };
  }

  updateLevelBounds(levelWidth, levelHeight) {
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
    this.maxX = Math.max(0, this.levelWidth - this.width);
    this.maxY = Math.max(0, this.levelHeight - this.height);
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
  }

  getProjectionMatrix(alpha = 1.0) {

    const renderX = this.prevX + (this.x - this.prevX) * alpha;
    const renderY = this.prevY + (this.y - this.prevY) * alpha;


    const left = (renderX + this.shakeX);
    const right = (renderX + this.shakeX) + this.width;
    const top = (renderY + this.shakeY);
    const bottom = (renderY + this.shakeY) + this.height;


    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (-1 - 1);


    this.projectionMatrix[0] = -2 * lr;
    this.projectionMatrix[1] = 0;
    this.projectionMatrix[2] = 0;
    this.projectionMatrix[3] = 0;


    this.projectionMatrix[4] = 0;
    this.projectionMatrix[5] = -2 * bt;
    this.projectionMatrix[6] = 0;
    this.projectionMatrix[7] = 0;


    this.projectionMatrix[8] = 0;
    this.projectionMatrix[9] = 0;
    this.projectionMatrix[10] = 2 * nf;
    this.projectionMatrix[11] = 0;


    this.projectionMatrix[12] = (left + right) * lr;
    this.projectionMatrix[13] = (top + bottom) * bt;
    this.projectionMatrix[14] = (1 + -1) * nf;
    this.projectionMatrix[15] = 1;

    return this.projectionMatrix;
  }

  isVisible(worldX, worldY, width = 0, height = 0) { return (worldX + width > this.x && worldX < this.x + this.width && worldY + height > this.y && worldY < this.y + this.height); }
  isRectVisible(rect) { return this.isVisible(rect.x, rect.y, rect.width, rect.height); }
  setFollowSpeed(speed) { this.followSpeed = Math.max(0.1, speed); }
  setDeadZone(xPercent, yPercent) { this.deadZone.x = this.width * Math.max(0, Math.min(0.5, xPercent)); this.deadZone.y = this.height * Math.max(0, Math.min(0.5, yPercent)); }
}