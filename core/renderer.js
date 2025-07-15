// the renderer file is responsible for rendering the game world, including the player and other entities.
export class Renderer {
  constructor(ctx, canvas, assets) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
  }

  renderScene(camera, level, player, collectedFruits) {
    camera.apply(this.ctx);

    this.drawBackground(camera);
    level.render(this.ctx, this.assets);
    // Pass only active fruits to the draw function
    this.drawFruits(level.getActiveFruits(), camera);
    player.render(this.ctx);
    this.drawCollectedFruits(collectedFruits, camera);

    camera.restore(this.ctx);
  }

  drawBackground(camera) {
    const bg = this.assets.backgroundTile;

    if (!bg) {
      // Fallback solid color gradient if the asset is missing
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(camera.x, camera.y, this.canvas.width, this.canvas.height);
      return;
    }

    const tileSize = 64;
    const spriteSize = 64;
    const srcX = 0, srcY = 0;

    // Calculate which tiles are visible in the camera's viewport
    const startX = Math.floor(camera.x / tileSize);
    const startY = Math.floor(camera.y / tileSize);
    const endX = Math.ceil((camera.x + this.canvas.width) / tileSize);
    const endY = Math.ceil((camera.y + this.canvas.height) / tileSize);

    for (let i = startX; i <= endX; i++) {
      const x = i * tileSize;
      for (let j = startY; j <= endY; j++) {
        const y = j * tileSize;
        try {
          this.ctx.drawImage(
            bg,
            srcX, srcY,
            spriteSize, spriteSize,
            x, y,
            tileSize, tileSize
          );
        } catch (error) {
          // A single warning is better than spamming the console
          if (i === startX && j === startY) {
            console.warn('Failed to draw background tile:', error);
          }
          this.ctx.fillStyle = '#87CEEB';
          this.ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }

  // The 'fruits' array is now pre-filtered to only contain active fruits.
  drawFruits(fruits, camera) {
    for (let i = 0, len = fruits.length; i < len; i++) {
      const fruit = fruits[i];

      // Culling: Don't draw objects that are off-screen
      if (!camera.isVisible(fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, fruit.size, fruit.size)) {
        continue;
      }

      try {
        const img = this.assets[fruit.spriteKey];
        if (!img) {
          // Fallback rendering for missing fruit sprite
          this.ctx.fillStyle = '#FF6B6B';
          this.ctx.beginPath();
          this.ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
          continue;
        }

        const frameWidth = img.width / fruit.frameCount;
        const srcX = frameWidth * fruit.frame;

        this.ctx.drawImage(
          img,
          srcX, 0, frameWidth, img.height,
          fruit.x - fruit.size / 2, fruit.y - fruit.size / 2,
          fruit.size, fruit.size
        );
      } catch (error) {
        this.ctx.fillStyle = '#FF6B6B'; // Error fallback
        this.ctx.beginPath();
        this.ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  drawCollectedFruits(collectedArr, camera) {
    const sprite = this.assets['fruit_collected'];
    if (!sprite) return;

    const frameWidth = sprite.width / 6;
    const frameHeight = sprite.height;

    for (let i = 0, len = collectedArr.length; i < len; i++) {
      const collected = collectedArr[i];

      if (!camera.isVisible(collected.x - collected.size / 2, collected.y - collected.size / 2, collected.size, collected.size)) {
        continue;
      }

      const srcX = collected.frame * frameWidth;
      this.ctx.drawImage(
        sprite,
        srcX, 0,
        frameWidth, frameHeight,
        collected.x - collected.size / 2, collected.y - collected.size / 2,
        collected.size, collected.size
      );
    }
  }
}