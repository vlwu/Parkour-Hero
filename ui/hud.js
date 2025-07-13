export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.isVisible = true;
  }

  // Toggle HUD visibility
  setVisible(visible) {
    this.isVisible = visible;
  }

  // Draw the main game HUD
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
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: ${player.deathCount || 0}`,
        `Sound: ${soundSettings.enabled ? 'ON' : 'OFF'} (${Math.round(soundSettings.volume * 100)}%)`
      ];

      // Text styling
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
  drawLevelCompleteScreen(ctx, level, player, assets, hasNextLevel) {
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
    
    ctx.fillStyle = 'rgba(50, 50, 50, 0.95)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Title
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', this.canvas.width / 2, panelY + 60);
    
    // Stats
    const totalFruits = level.getTotalFruitCount();
    const collectedFruits = level.getFruitCount();
    const deaths = player.deathCount || 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Fruits: ${collectedFruits}/${totalFruits}`, this.canvas.width / 2, panelY + 120);
    ctx.fillText(`Deaths: ${deaths}`, this.canvas.width / 2, panelY + 150);
    
    // Buttons
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonY = panelY + 200;
    
    if (hasNextLevel) {
      // Next Level button
      const nextButtonX = this.canvas.width / 2 - buttonWidth - 10;
      
      const nextButtonImage = assets.next_level_button;
      if (nextButtonImage) {
        ctx.drawImage(nextButtonImage, nextButtonX, buttonY, buttonWidth, buttonHeight);
      } else {
        // Fallback rectangle if image not loaded
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(nextButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Next Level', nextButtonX + buttonWidth/2, buttonY + 25);
      }
    }

    // Restart button
    const restartButtonX = this.canvas.width / 2 + 10;
    
    const restartButtonImage = assets.restart_level_button;
    if (restartButtonImage) {
      ctx.drawImage(restartButtonImage, restartButtonX, buttonY, buttonWidth, buttonHeight);
    } else {
      // Fallback rectangle if image not loaded
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(restartButtonX, buttonY, buttonWidth, buttonHeight);
      ctx.fillStyle = 'white';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Restart', restartButtonX + buttonWidth/2, buttonY + 25);
    }

    ctx.restore();
  }

  // Handle clicks on level complete screen
  handleLevelCompleteClick(event, hasNextLevel) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonY = panelY + 200;
    
    // Check Next Level button (if available)
    if (hasNextLevel) {
      const nextButtonX = this.canvas.width / 2 - buttonWidth - 10;
      if (clickX >= nextButtonX && clickX <= nextButtonX + buttonWidth &&
          clickY >= buttonY && clickY <= buttonY + buttonHeight) {
        return 'next';
      }
    }
    
    // Check Restart button
    const restartButtonX = this.canvas.width / 2 + 10;
    if (clickX >= restartButtonX && clickX <= restartButtonX + buttonWidth &&
        clickY >= buttonY && clickY <= buttonY + buttonHeight) {
      return 'restart';
    }
    
    return null; // No button clicked
  }

  // Draw pause screen (for future use)
  drawPauseScreen(ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Pause text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    
    ctx.restore();
  }

  // Draw settings menu (for future use)
  drawSettingsMenu(ctx, soundManager) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Settings panel
    const panelWidth = 350;
    const panelHeight = 250;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    ctx.fillStyle = 'rgba(50, 50, 50, 0.95)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Title
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Settings', this.canvas.width / 2, panelY + 40);
    
    // Sound settings
    const soundSettings = soundManager.getSettings();
    ctx.fillStyle = 'white';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Sound: ${soundSettings.enabled ? 'ON' : 'OFF'}`, this.canvas.width / 2, panelY + 80);
    ctx.fillText(`Volume: ${Math.round(soundSettings.volume * 100)}%`, this.canvas.width / 2, panelY + 110);
    
    // Instructions
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Press ESC to close', this.canvas.width / 2, panelY + 200);
    
    ctx.restore();
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
}