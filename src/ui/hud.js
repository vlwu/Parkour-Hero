import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class HUD {
  constructor(ctx, fontRenderer) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.fontRenderer = fontRenderer;
    this.isVisible = true;
    this.stats = {
      levelName: 'Loading...',
      collectedFruits: 0,
      totalFruits: 0,
      deathCount: 0,
      soundEnabled: true,
      soundVolume: 0.5,
      health: 100,
      maxHealth: 100
    };


    this.fps = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;

    eventBus.subscribe('statsUpdated', (newStats) => this.updateStats(newStats));
  }

  setVisible(visible) {
    this.isVisible = visible;
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
  }

  drawMinimap(ctx, camera, level, entityManager, playerEntityId) {
    if (!level) return;

    const MAP_MAX_SIZE = 300;
    const MAP_MARGIN = 20;

    const levelAspectRatio = level.width / level.height;
    let mapWidth, mapHeight;

    if (levelAspectRatio > 1) {
        mapWidth = MAP_MAX_SIZE;
        mapHeight = MAP_MAX_SIZE / levelAspectRatio;
    } else {
        mapHeight = MAP_MAX_SIZE;
        mapWidth = MAP_MAX_SIZE * levelAspectRatio;
    }

    const mapX = ctx.canvas.width - mapWidth - MAP_MARGIN;
    const mapY = ctx.canvas.height - mapHeight - MAP_MARGIN;

    const scaleX = mapWidth / level.width;
    const scaleY = mapHeight / level.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);

    const viewRectX = mapX + camera.x * scaleX;
    const viewRectY = mapY + camera.y * scaleY;
    const viewRectWidth = camera.width * scaleX;
    const viewRectHeight = camera.height * scaleY;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(viewRectX, viewRectY, viewRectWidth, viewRectHeight);

    if (level && level.fruits) {
      ctx.fillStyle = '#2b5cb7ff'; // A reddish color for fruits
      for (const fruit of level.fruits) {
        if (!fruit.collected) {
          const fruitMapX = mapX + fruit.x * scaleX;
          const fruitMapY = mapY + fruit.y * scaleY;
          ctx.beginPath();
          ctx.arc(fruitMapX, fruitMapY, 2, 0, 2 * Math.PI); // Smaller radius (2)
          ctx.fill();
        }
      }
    }

    if (entityManager && playerEntityId !== null) {
        const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
        const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);
        if (playerPos && playerCol) {
            const playerMapX = mapX + (playerPos.x + playerCol.width / 2) * scaleX;
            const playerMapY = mapY + (playerPos.y + playerCol.height / 2) * scaleY;

            ctx.fillStyle = '#1a8916ff';
            ctx.beginPath();
            ctx.arc(playerMapX, playerMapY, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    if (level && level.trophy) {
        const trophyMapX = mapX + level.trophy.x * scaleX;
        const trophyMapY = mapY + level.trophy.y * scaleY;

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(trophyMapX, trophyMapY, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.restore();
  }

  drawGameHUD(ctx, camera, level, dt, entityManager, playerEntityId) {
    if (!this.isVisible || !this.fontRenderer) return;


    this.frameCount++;
    this.elapsedTime += dt;
    if (this.elapsedTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.elapsedTime -= 1;
    }

    try {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const { levelName, collectedFruits, totalFruits, deathCount, soundEnabled, soundVolume, health, maxHealth } = this.stats;

      const lines = [
        `${levelName}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: ${deathCount || 0}`,
        `Sound: ${soundEnabled ? 'On' : 'Off'} (${Math.round(soundVolume * 100)}%)`
      ];

      const fontOptions = {
          scale: 2.5,
          align: 'center',
          color: 'white',
          outlineColor: 'black',
          outlineWidth: 1
      };


      let maxWidth = 0;
      lines.forEach(line => {
        const width = this.fontRenderer.getTextWidth(line, fontOptions.scale);
        if (width > maxWidth) {
          maxWidth = width;
        }
      });

      const horizontalPadding = 40;
      const hudX = 10;
      const hudY = 10;
      const hudWidth = maxWidth + horizontalPadding;
      const hudHeight = 180;


      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 10);
      ctx.fill();

      const lineHeight = 35;
      const startY = hudY + 25;
      const textX = hudX + hudWidth / 2;

      lines.forEach((text, index) => {
        const y = startY + index * lineHeight;
        this.fontRenderer.drawText(ctx, text, textX, y, fontOptions);
      });


      const healthBarWidth = 150;
      const healthBarHeight = 20;
      const healthBarX = hudX + hudWidth + 15;
      const healthBarY = hudY;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(healthBarX - 2, healthBarY - 2, healthBarWidth + 4, healthBarHeight + 4);
      ctx.fillStyle = 'rgba(51, 51, 51, 0.7)';
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      const healthPercentage = (health || 0) / (maxHealth || 100);
      const currentHealthWidth = healthBarWidth * healthPercentage;

      if (healthPercentage > 0.6) {
          ctx.fillStyle = '#4CAF50';
      } else if (healthPercentage > 0.3) {
          ctx.fillStyle = '#FFC107';
      } else {
          ctx.fillStyle = '#F44336';
      }

      ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

      this.fontRenderer.drawText(ctx, `HP`, healthBarX + healthBarWidth + 10, healthBarY + healthBarHeight / 2 - 12, { scale: 2, align: 'left' });


      const fpsText = `FPS: ${this.fps}`;
      const fpsFontOptions = {
          scale: 2,
          align: 'left',
          color: 'white',
          outlineColor: 'black',
          outlineWidth: 1
      };
      const fpsX = healthBarX;
      const fpsY = healthBarY + healthBarHeight + 10;
      this.fontRenderer.drawText(ctx, fpsText, fpsX, fpsY, fpsFontOptions);

      this.drawMinimap(ctx, camera, level, entityManager, playerEntityId);

      ctx.restore();

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}