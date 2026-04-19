import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { formatTime } from './ui-utils.js';

export class HUD {
  constructor(ctx, fontRenderer, gameplaySettings, assets) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.fontRenderer = fontRenderer;
    this.isVisible = true;
    this.settings = gameplaySettings;
    this.assets = assets;
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
    
    this.coinFrame = 0;
    this.coinTimer = 0;

    // Minimap Cache
    this.minimapCacheCanvas = document.createElement('canvas');
    this.minimapCacheCtx = this.minimapCacheCanvas.getContext('2d');
    this._lastLevel = null;
    this._lastMinimapSize = -1;
    this._lastFruitCount = -1;

    // HUD Text Cache
    this.textCacheCanvas = document.createElement('canvas');
    this.textCacheCtx = this.textCacheCanvas.getContext('2d');
    this._lastTextStatsStr = '';

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

  _updateMinimapCache(level, mapWidth, mapHeight, scaleX, scaleY) {
    this.minimapCacheCanvas.width = mapWidth;
    this.minimapCacheCanvas.height = mapHeight;
    const ctx = this.minimapCacheCtx;

    ctx.clearRect(0, 0, mapWidth, mapHeight);

    // Draw Background & Border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, mapWidth, mapHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeRect(0, 0, mapWidth, mapHeight);

    // Draw Uncollected Fruits
    if (level && level.fruits) {
      ctx.fillStyle = '#2b5cb7ff';
      for (const fruit of level.fruits) {
        if (!fruit.collected) {
          const fruitMapX = fruit.x * scaleX;
          const fruitMapY = fruit.y * scaleY;
          ctx.beginPath();
          ctx.arc(fruitMapX, fruitMapY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Draw Trophy
    if (level && level.trophy) {
      const trophyMapX = level.trophy.x * scaleX;
      const trophyMapY = level.trophy.y * scaleY;
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(trophyMapX, trophyMapY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    this._lastLevel = level;
    this._lastMinimapSize = this.settings.minimapSize;
    this._lastFruitCount = level ? level.collectedFruitCount : -1;
  }

  _updateTextCache(lines, hudX, hudY, hudWidth, hudHeight, fontOptions, lineHeight, startY, textX) {
      // Size the cache canvas to hold the entire box exactly
      this.textCacheCanvas.width = hudWidth;
      this.textCacheCanvas.height = hudHeight;
      const ctx = this.textCacheCtx;
      
      ctx.clearRect(0, 0, hudWidth, hudHeight);

      // Draw Background Box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(0, 0, hudWidth, hudHeight, 10);
      ctx.fill();

      const localStartX = textX - hudX;
      const localStartY = startY - hudY;

      lines.forEach((text, index) => {
        const y = localStartY + index * lineHeight;
        this.fontRenderer.drawText(ctx, text, localStartX, y, fontOptions);
      });
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

    // Rebuild cache only if state has changed
    if (this._lastLevel !== level || 
        this._lastMinimapSize !== this.settings.minimapSize || 
        this._lastFruitCount !== level.collectedFruitCount) {
        this._updateMinimapCache(level, mapWidth, mapHeight, scaleX, scaleY);
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw the static cached minimap layer
    ctx.drawImage(this.minimapCacheCanvas, mapX, mapY);

    // Draw the dynamic camera view
    const viewRectX = mapX + camera.x * scaleX;
    const viewRectY = mapY + camera.y * scaleY;
    const viewRectWidth = camera.width * scaleX;
    const viewRectHeight = camera.height * scaleY;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(viewRectX, viewRectY, viewRectWidth, viewRectHeight);

    // Draw the dynamic player marker
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
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - borderSize, y - borderSize, barWidth + borderSize * 2, barHeight + borderSize * 2);

      ctx.fillStyle = 'rgba(50, 50, 50, 1)';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Foreground Health 
      // Base the bar size off of 100 max health so items like Glass Cannon (1 Max HP) visually look incredibly fragile.
      const visualMax = Math.max(health.maxHealth, 100);
      const healthPct = health.currentHealth / visualMax;
      
      if (healthPct > 0.6) ctx.fillStyle = '#2ecc71'; // Green
      else if (healthPct > 0.3) ctx.fillStyle = '#f1c40f'; // Yellow
      else ctx.fillStyle = '#e74c3c'; // Red

      ctx.fillRect(x, y, barWidth * healthPct, barHeight);

      // --- Dash Cooldown Bar ---
      const dashY = y + barHeight + spacing;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - borderSize, dashY - borderSize, barWidth + borderSize * 2, dashBarHeight + borderSize * 2);

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
      
      // --- Lunar Cycle Indicator ---
      if (ctrl.lunarCycle) {
          const cycle = (Math.sin((ctrl.lunarTimer / 10) * Math.PI * 2) + 1) / 2; // 0 to 1
          const moonY = y - 10;
          
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.arc(x + barWidth/2, moonY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f1c40f'; // Yellow
          ctx.globalAlpha = 1.0 - cycle; // 1 = full moon (lightest), 0 = new moon (heaviest)
          ctx.beginPath();
          ctx.arc(x + barWidth/2, moonY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
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

      const { levelName, collectedFruits, totalFruits, deathCount, soundEnabled, soundVolume, levelTime } = this.stats;

      const lines = [
        `${levelName}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: ${deathCount || 0}`,
        `Sound: ${soundEnabled ? 'On' : 'Off'} (${Math.round(soundVolume * 100)}%)`
      ];
      
      // Generate a string representation of the stats that affect the cached text
      const currentStatsStr = lines.join('|');

      const fontOptions = {
          scale: 2.5,
          align: 'center',
          color: 'white',
          outlineColor: 'black',
          outlineWidth: 1
      };

      const horizontalPadding = 40;
      const hudX = 10;
      const hudY = 10;
      const hudHeight = 160; 

      let maxWidth = 0;
      // Only recalculate widths and redraw cache if the stats have actually changed
      if (currentStatsStr !== this._lastTextStatsStr) {
          lines.forEach(line => {
            const width = this.fontRenderer.getTextWidth(line, fontOptions.scale);
            if (width > maxWidth) {
              maxWidth = width;
            }
          });
          
          const hudWidth = maxWidth + horizontalPadding;
          const lineHeight = 35;
          const startY = hudY + 15;
          const textX = hudX + hudWidth / 2;
          
          this._updateTextCache(lines, hudX, hudY, hudWidth, hudHeight, fontOptions, lineHeight, startY, textX);
          this._lastTextStatsStr = currentStatsStr;
      }
      
      // Draw the cached background and text
      ctx.drawImage(this.textCacheCanvas, hudX, hudY);
      
      // We still need hudWidth for the coin display positioning
      const hudWidth = this.textCacheCanvas.width;
      
      // HUD Coin Display
      this.coinTimer += dt;
      // Use modulo logic to process time debt appropriately without rapid catch-up spins
      if (this.coinTimer >= 0.05) {
          const framesToAdvance = Math.floor(this.coinTimer / 0.05);
          this.coinFrame = (this.coinFrame + framesToAdvance) % 14;
          this.coinTimer %= 0.05;
      }

      const coinsStr = `${this.stats.fruitCoins || 0}`;
      const coinTextScale = 2;
      const coinTextWidth = this.fontRenderer.getTextWidth(coinsStr, coinTextScale);
      
      const iconSize = 32;
      const gap = 10;
      const coinHorizontalPadding = 15;
      const coinDisplayWidth = coinHorizontalPadding * 2 + iconSize + gap + coinTextWidth;
      const coinDisplayHeight = 48;
      
      const coinX = hudX + hudWidth + 15;
      const coinY = hudY;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(coinX, coinY, coinDisplayWidth, coinDisplayHeight, 24);
      ctx.fill();
      
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.stroke();

      const coinSprite = this.assets ? this.assets.coin_icon : null;
      if (coinSprite) {
          const frameWidth = coinSprite.width / 14;
          ctx.drawImage(
              coinSprite,
              this.coinFrame * frameWidth, 0, frameWidth, coinSprite.height,
              coinX + coinHorizontalPadding, coinY + (coinDisplayHeight - iconSize) / 2, iconSize, iconSize
          );
      }

      this.fontRenderer.drawText(
          ctx, coinsStr, 
          coinX + coinHorizontalPadding + iconSize + gap, 
          coinY + (coinDisplayHeight - 10 * coinTextScale) / 2, 
          { scale: coinTextScale, color: '#f1c40f', outlineColor: 'black', outlineWidth: 1 }
      );

      const fpsText = `FPS: ${this.fps}`;
      const timeText = `Time: ${formatTime(levelTime || 0)}`;
      const fpsFontOptions = {
          scale: 2,
          align: 'left',
          color: 'white',
          outlineColor: 'black',
          outlineWidth: 1
      };
      
      this.fontRenderer.drawText(ctx, fpsText, hudX, hudY + hudHeight + 10, fpsFontOptions);
      this.fontRenderer.drawText(ctx, timeText, hudX, hudY + hudHeight + 40, fpsFontOptions);

      this.drawMinimap(ctx, camera, level, entityManager, playerEntityId);

      ctx.restore();

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}