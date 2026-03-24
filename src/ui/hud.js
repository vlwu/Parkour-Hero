import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class HUD {
  constructor(ctx, fontRenderer, gameplaySettings, assets) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.fontRenderer = fontRenderer;
    this.assets = assets;
    this.isVisible = true;
    this.settings = gameplaySettings;
    this.stats = {
      levelName: 'Loading...',
      collectedFruits: 0,
      totalFruits: 0,
      deathCount: 0,
      soundEnabled: true,
      soundVolume: 0.5,
      health: 100,
      maxHealth: 100,
      fruitCoins: 0
    };


    this.fps = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;

    eventBus.subscribe('statsUpdated', (newStats) => this.updateStats(newStats));
  }

  setVisible(visible) {
    this.isVisible = visible;
  }

  updateSettings(newSettings) {
      this.settings = newSettings;
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
  }

  drawMinimap(ctx, camera, level, entityManager, playerEntityId) {
    if (!level) return;

    const MAP_MAX_SIZE = 300 * this.settings.minimapSize;
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
      ctx.fillStyle = '#2b5cb7ff';
      for (const fruit of level.fruits) {
        if (!fruit.collected) {
          const fruitMapX = mapX + fruit.x * scaleX;
          const fruitMapY = mapY + fruit.y * scaleY;
          ctx.beginPath();
          ctx.arc(fruitMapX, fruitMapY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    if (entityManager && playerEntityId !== null && playerEntityId !== undefined) {
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

  _drawPlayerOverlays(ctx, camera, entityManager, playerEntityId) {
      if (playerEntityId === null || playerEntityId === undefined) return;
      const pos = entityManager.getComponent(playerEntityId, PositionComponent);
      const col = entityManager.getComponent(playerEntityId, CollisionComponent);
      const health = entityManager.getComponent(playerEntityId, HealthComponent);
      const ctrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);

      if (!pos || !col || !health || !ctrl || ctrl.isSpawning || ctrl.isDespawning || ctrl.needsRespawn) return;

      const barWidth = PLAYER_CONSTANTS.WIDTH; 
      const barHeight = 3;
      const dashBarHeight = 1.2;
      const spacing = 0; // Spacing between health bar and dash bar (including borders)
      const yOffset = 14; // Distance above player
      const borderSize = 1;

      // Draw in World Space relative to camera (handled by camera.apply)
      const x = pos.x + (col.width - barWidth) / 2;
      const y = pos.y - yOffset;

      // --- Health Bar ---
      // Black Border
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - borderSize, y - borderSize, barWidth + borderSize * 2, barHeight + borderSize * 2);

      // Background (Dark)
      ctx.fillStyle = 'rgba(50, 50, 50, 1)';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Foreground Health
      const healthPct = health.currentHealth / health.maxHealth;
      if (healthPct > 0.6) ctx.fillStyle = '#2ecc71'; // Green
      else if (healthPct > 0.3) ctx.fillStyle = '#f1c40f'; // Yellow
      else ctx.fillStyle = '#e74c3c'; // Red

      ctx.fillRect(x, y, barWidth * healthPct, barHeight);

      // --- Dash Cooldown Bar ---
      const dashY = y + barHeight + spacing;
      
      // Black Border
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - borderSize, dashY - borderSize, barWidth + borderSize * 2, dashBarHeight + borderSize * 2);

      // Background (Dark)
      ctx.fillStyle = 'rgba(50, 50, 50, 1)';
      ctx.fillRect(x, dashY, barWidth, dashBarHeight);

      // Calculate Dash Capacity
      const availableDashes = Math.max(0, ctrl.maxDashes - ctrl.currentDashCount);
      let dashPct = availableDashes / ctrl.maxDashes;
      
      // Foreground Dash
      if (dashPct > 0) {
          ctx.fillStyle = '#00BCD4'; // Cyan
          ctx.fillRect(x, dashY, barWidth * dashPct, dashBarHeight);
      }
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
      // 1. Draw Player Overlays (Health/Dash) using camera transform
      camera.apply(ctx);
      this._drawPlayerOverlays(ctx, camera, entityManager, playerEntityId);
      camera.restore(ctx);

      // 2. Draw Static HUD Elements (Screen Space)
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const { levelName, collectedFruits, totalFruits, deathCount, soundEnabled, soundVolume, fruitCoins } = this.stats;

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
      const hudHeight = 160; 

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 10);
      ctx.fill();

      const lineHeight = 35;
      const startY = hudY + 15;
      const textX = hudX + hudWidth / 2;

      lines.forEach((text, index) => {
        const y = startY + index * lineHeight;
        this.fontRenderer.drawText(ctx, text, textX, y, fontOptions);
      });

      // Coin Display right next to HUD
      const coinBoxX = hudX + hudWidth + 10;
      const coinBoxWidth = 100;
      const coinBoxHeight = 44;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(coinBoxX, hudY, coinBoxWidth, coinBoxHeight, 10);
      ctx.fill();
      
      const coinSprite = this.assets?.coin_icon;
      if (coinSprite) {
          const frameCount = 14;
          const frameSpeed = 0.05;
          const currentFrame = Math.floor((performance.now() / 1000) / frameSpeed) % frameCount;
          const frameWidth = coinSprite.width / frameCount;
          
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f1c40f';
          ctx.drawImage(coinSprite, currentFrame * frameWidth, 0, frameWidth, coinSprite.height, coinBoxX + 7, hudY + 10, 24, 24);
          ctx.restore();
          
          this.fontRenderer.drawText(ctx, `${fruitCoins || 0}`, coinBoxX + 35, hudY + 14, { scale: 1.8, color: '#f1c40f', outlineColor: 'black', outlineWidth: 1 });
      }

      const fpsText = `FPS: ${this.fps}`;
      const fpsFontOptions = {
          scale: 2,
          align: 'left',
          color: 'white',
          outlineColor: 'black',
          outlineWidth: 1
      };
      
      this.fontRenderer.drawText(ctx, fpsText, hudX, hudY + hudHeight + 10, fpsFontOptions);

      this.drawMinimap(ctx, camera, level, entityManager, playerEntityId);

      ctx.restore();

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}