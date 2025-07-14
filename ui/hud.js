export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.isVisible = true;
  }

  // Toggle HUD visibility
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

      // HUD background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 10);
      ctx.fill();

      // Get game stats
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

      // Draw each line with stroke and fill
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

  // Draw level complete screen
  drawLevelCompleteScreen(ctx, level, player, assets, hasNextLevel, hasPreviousLevel) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Main panel
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
    
    // Title
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Level Complete!`, this.canvas.width / 2, panelY + 60);
    
    // Stats
    const deaths = player.deathCount || 0;
    const timeText = this.formatTime(this.getCurrentLevelTime());
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Time Taken: ${timeText}`, this.canvas.width / 2, panelY + 120);
    ctx.fillText(`Deaths: ${deaths}`, this.canvas.width / 2, panelY + 150);
    
    // Buttons
    const buttonWidth = 32;
    const buttonHeight = 32;
    const buttonY = panelY + 200;

    // Calculate button positions based on available buttons
    const availableButtons = [];
    if (hasPreviousLevel) availableButtons.push('previous');
    if (hasNextLevel) availableButtons.push('next');
    availableButtons.push('restart');

    const totalButtonWidth = availableButtons.length * buttonWidth + (availableButtons.length - 1) * 10;
    const startX = (this.canvas.width - totalButtonWidth) / 2;

    let currentX = startX;

    // Previous Level button
    if (hasPreviousLevel) {
      const previousButtonImage = assets.previous_level_button;
      if (previousButtonImage) {
        ctx.drawImage(previousButtonImage, currentX, buttonY, buttonWidth, buttonHeight);
      } else {
        // Fallback rectangle if image not loaded
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(currentX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Prev', currentX + buttonWidth/2, buttonY + 25);
      }
      currentX += buttonWidth + 10;
    }

    // Next Level button
    if (hasNextLevel) {
      const nextButtonImage = assets.next_level_button;
      if (nextButtonImage) {
        ctx.drawImage(nextButtonImage, currentX, buttonY, buttonWidth, buttonHeight);
      } else {
        // Fallback rectangle if image not loaded
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(currentX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Next', currentX + buttonWidth/2, buttonY + 25);
      }
      currentX += buttonWidth + 10;
    }
    
    // Restart button
    const restartButtonImage = assets.restart_level_button;
    if (restartButtonImage) {
      ctx.drawImage(restartButtonImage, currentX, buttonY, buttonWidth, buttonHeight);
    } else {
      // Fallback rectangle if image not loaded
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(currentX, buttonY, buttonWidth, buttonHeight);
      ctx.fillStyle = 'white';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Restart', currentX + buttonWidth/2, buttonY + 25);
    }

    ctx.restore();
  }

  // Handle clicks on level complete screen
  handleLevelCompleteClick(event, hasNextLevel, hasPreviousLevel) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const panelHeight = 300;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    const buttonWidth = 32;
    const buttonHeight = 32;
    const buttonY = panelY + 200;

    // Calculate button positions based on available buttons
    const availableButtons = [];
    if (hasPreviousLevel) availableButtons.push('previous');
    if (hasNextLevel) availableButtons.push('next');
    availableButtons.push('restart');

    const totalButtonWidth = availableButtons.length * buttonWidth + (availableButtons.length - 1) * 10;
    const startX = (this.canvas.width - totalButtonWidth) / 2;

    let currentX = startX;

    // Check Previous Level button
    if (hasPreviousLevel) {
      if (clickX >= currentX && clickX <= currentX + buttonWidth &&
          clickY >= buttonY && clickY <= buttonY + buttonHeight) {
        event.stopPropagation();
        return 'previous';
      }
      currentX += buttonWidth + 10;
    }

    // Check Next Level button  
    if (hasNextLevel) {
      if (clickX >= currentX && clickX <= currentX + buttonWidth &&
          clickY >= buttonY && clickY <= buttonY + buttonHeight) {
        event.stopPropagation();
        return 'next';
      }
      currentX += buttonWidth + 10;
    }

    // Check Restart button
    if (clickX >= currentX && clickX <= currentX + buttonWidth &&
        clickY >= buttonY && clickY <= buttonY + buttonHeight) {
      event.stopPropagation();
      return 'restart';
    }
    
    return null; // No button clicked
  }

  // Draw loading screen (for future use)
  drawLoadingScreen(ctx, progress = 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Background
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Loading text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    // Progress bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = this.canvas.height / 2;
    
    // Progress bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress bar fill
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Progress percentage
    ctx.fillStyle = 'white';
    ctx.font = '18px sans-serif';
    ctx.fillText(`${Math.round(progress * 100)}%`, this.canvas.width / 2, barY + 40);
    
    ctx.restore();
  }

  // Get current level time from engine
  getCurrentLevelTime() {
    return this.levelTime || 0;
  }

  // Format time as MM:SS.mmm
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const wholeSeconds = Math.floor(remainingSeconds);
    const milliseconds = Math.floor((remainingSeconds - wholeSeconds) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
}