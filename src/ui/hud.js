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
      soundVolume: 0.5
    };
    eventBus.subscribe('statsUpdated', (newStats) => this.updateStats(newStats));
  }

  setVisible(visible) {
    this.isVisible = visible;
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
  }

  drawGameHUD(ctx) {
    if (!this.isVisible || !this.fontRenderer) return;

    try {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const { levelName, collectedFruits, totalFruits, deathCount, soundEnabled, soundVolume } = this.stats;
      
      const lines = [
        `${levelName}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: ${deathCount || 0}`,
        `Sound: ${soundEnabled ? 'On' : 'Off'} (${Math.round(soundVolume * 100)}%)`
      ];
      
      const fontOptions = {
          scale: 1.6,
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
      
      const horizontalPadding = 30;
      const hudX = 10;
      const hudY = 10;
      const hudWidth = maxWidth + horizontalPadding;
      const hudHeight = 110;

      // --- DRAWING ---
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 10);
      ctx.fill();

      const lineHeight = 22;
      const startY = hudY + 15;
      const textX = hudX + hudWidth / 2;
      
      lines.forEach((text, index) => {
        const y = startY + index * lineHeight;
        this.fontRenderer.drawText(ctx, text, textX, y, fontOptions);
      });

      ctx.restore();

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}