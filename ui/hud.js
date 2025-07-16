export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.isVisible = true;
  }

  _getButtonLayout(screenType, hasNextLevel, hasPreviousLevel) {
    const BUTTON_SIZE = 32;
    const buttons = [];
    
    const PANEL_HEIGHT = 300;
    const PANEL_Y_OFFSET = (this.canvas.height - PANEL_HEIGHT) / 2;
    const BUTTON_Y_OFFSET = PANEL_Y_OFFSET + 200;

    let gap;

    if (screenType === 'levelComplete') {
        gap = 10;
        // Define buttons with their properties
        const actionButtons = [];
        if (hasPreviousLevel) actionButtons.push({ name: 'previous', asset: 'previous_level_button' });
        actionButtons.push({ name: 'restart', asset: 'restart_level_button' });
        if (hasNextLevel) actionButtons.push({ name: 'next', asset: 'next_level_button' });
        buttons.push(...actionButtons);
    } else { // 'pause'
        gap = 20;
        buttons.push({ name: 'resume', asset: 'resume_button' });
        buttons.push({ name: 'restart', asset: 'restart_level_button' });
        buttons.push({ name: 'main_menu', asset: 'level_menu_button' });
    }

    const totalButtonWidth = (buttons.length * BUTTON_SIZE) + (Math.max(0, buttons.length - 1) * gap);
    let currentX = (this.canvas.width - totalButtonWidth) / 2;

    for (const button of buttons) {
        button.x = currentX;
        button.y = BUTTON_Y_OFFSET;
        button.width = BUTTON_SIZE;
        button.height = BUTTON_SIZE;
        currentX += BUTTON_SIZE + gap;
    }

    return buttons;
  }

  setVisible(visible) {
    this.isVisible = visible;
  }

  drawGameHUD(ctx, level, player, soundManager) {
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

      const totalFruits = level.getTotalFruitCount();
      const collectedFruits = level.getFruitCount();
      const soundSettings = soundManager.getSettings();
      
      const lines = [
        `${level.name}`,
        `Fruits: ${collectedFruits} / ${totalFruits}`,
        `Deaths: ${player.deathCount || 0}`,
        `Sound: ${soundSettings.enabled ? 'On' : 'Off'} (${Math.round(soundSettings.volume * 100)}%)`
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

  // MODIFIED to accept levelTime parameter for consistency
  drawLevelCompleteScreen(ctx, level, player, assets, hasNextLevel, hasPreviousLevel, levelTime = 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    ctx.fillStyle = 'rgba(50, 50, 50, 0.75)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    ctx.strokeStyle = '#4d4d4dff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Level Complete!`, this.canvas.width / 2, panelY + 60);
    
    const deaths = player.deathCount || 0;
    const timeText = this.formatTime(levelTime); // Use passed-in time
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Deaths: ${deaths}`, this.canvas.width / 2, panelY + 120);
    ctx.fillText(`Time Taken: ${timeText}`, this.canvas.width / 2, panelY + 150);
    
    const buttons = this._getButtonLayout('levelComplete', hasNextLevel, hasPreviousLevel);
    buttons.forEach(button => {
        const image = assets[button.asset];
        if (image) {
            ctx.drawImage(image, button.x, button.y, button.width, button.height);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(button.x, button.y, button.width, button.height);
        }
    });

    ctx.restore();
  }

  drawPauseScreen(ctx, level, player, assets, levelTime = 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    ctx.fillStyle = 'rgba(50, 50, 50, 0.75)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    ctx.strokeStyle = '#4d4d4dff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffcc00ff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Paused', this.canvas.width / 2, panelY + 60);

    ctx.fillStyle = '#3cff00ff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Click play or press ESC to resume', this.canvas.width / 2, panelY + 100);

    const collectedFruits = level.getFruitCount();
    const totalFruits = level.getTotalFruitCount();
    const deaths = player.deathCount || 0;
    const timeText = this.formatTime(levelTime);

    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Fruits: ${collectedFruits} / ${totalFruits}`, this.canvas.width / 2, panelY + 135);
    ctx.fillText(`Deaths: ${deaths}`, this.canvas.width / 2, panelY + 160);
    ctx.fillText(`Time Taken: ${timeText}`, this.canvas.width / 2, panelY + 185);

    const buttons = this._getButtonLayout('pause');
    buttons.forEach(button => {
        const image = assets[button.asset];
        if (image) {
            ctx.drawImage(image, button.x, button.y, button.width, button.height);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(button.x, button.y, button.width, button.height);
        }
    });

    ctx.restore();
  }

  handlePauseScreenClick(x, y) {
    const buttons = this._getButtonLayout('pause');
    for (const button of buttons) {
        if (x >= button.x && x <= button.x + button.width &&
            y >= button.y && y <= button.y + button.height) {
            return button.name;
        }
    }
    return null;
  }

  handleLevelCompleteClick(x, y, hasNextLevel, hasPreviousLevel) {
    const buttons = this._getButtonLayout('levelComplete', hasNextLevel, hasPreviousLevel);
    for (const button of buttons) {
        if (x >= button.x && x <= button.x + button.width &&
            y >= button.y && y <= button.y + button.height) {
            return button.name;
        }
    }
    return null;
  }

  getCurrentLevelTime() {
    return this.levelTime || 0;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const wholeSeconds = Math.floor(remainingSeconds);
    const milliseconds = Math.floor((remainingSeconds - wholeSeconds) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
}
