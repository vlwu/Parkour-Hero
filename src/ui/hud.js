import { eventBus } from '../utils/event-bus.js';

export class HUD {
  constructor(canvas, fontRenderer) {
    this.canvas = canvas;
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
    
    // Properties for FPS calculation
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

  drawGameHUD(ctx, dt) {
    if (!this.isVisible || !this.fontRenderer) return;

    // --- FPS Calculation ---
    this.frameCount++;
    this.elapsedTime += dt;
    if (this.elapsedTime >= 1) { // Update the FPS display once per second
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

      // --- DYNAMIC WIDTH CALCULATION ---
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

      // --- DRAWING ---
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

      // --- HEALTH BAR ---
      const healthBarWidth = 150;
      const healthBarHeight = 20;
      const healthBarX = hudX + hudWidth + 15;
      const healthBarY = hudY;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(healthBarX - 2, healthBarY - 2, healthBarWidth + 4, healthBarHeight + 4);
      ctx.fillStyle = '#333';
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
      
      // --- FPS DISPLAY ---
      const fpsText = `FPS: ${this.fps}`;
      const fpsFontOptions = {
          scale: 2,
          align: 'left',
          color: 'white',
          outlineColor: 'black',
          outlineWidth: 1
      };
      const fpsX = healthBarX;
      const fpsY = healthBarY + healthBarHeight + 10; // Position below the health bar
      this.fontRenderer.drawText(ctx, fpsText, fpsX, fpsY, fpsFontOptions);

      ctx.restore();

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}