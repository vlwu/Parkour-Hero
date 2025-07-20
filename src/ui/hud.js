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
      
      // Adjusted padding and height for the larger font and resolution
      const horizontalPadding = 40;
      const hudX = 10;
      const hudY = 10;
      const hudWidth = maxWidth + horizontalPadding;
      const hudHeight = 180; // Increased height

      // --- DRAWING ---
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 10);
      ctx.fill();

      // Adjusted line height and starting position for the new scale
      const lineHeight = 35; 
      const startY = hudY + 25; 
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