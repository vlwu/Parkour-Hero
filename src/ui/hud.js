import { eventBus } from '../utils/event-bus.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
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
    if (!this.isVisible) return;

    try {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const hudX = 10;
      const hudY = 10;
      const hudWidth = 280;
      const hudHeight = 100;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 10);
      ctx.fill();

      const { levelName, collectedFruits, totalFruits, deathCount, soundEnabled, soundVolume } = this.stats;
      
      const lines = [
        `${levelName}`,
        `Fruits: ${collectedFruits} / ${totalFruits}`,
        `Deaths: ${deathCount || 0}`,
        `Sound: ${soundEnabled ? 'On' : 'Off'} (${Math.round(soundVolume * 100)}%)`
      ];

      ctx.font = '16px sans-serif';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';

      const lineHeight = 22;
      const totalTextHeight = lines.length * lineHeight;
      const startY = hudY + (hudHeight - totalTextHeight) / 2 + lineHeight - 6;
      const textX = hudX + hudWidth / 2;

      lines.forEach((text, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(text, textX, y);
        ctx.fillText(text, textX, y);
      });

      ctx.restore();

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}