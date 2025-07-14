// Enhanced HUD.js with improved pause screen GUI
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

  // Enhanced pause screen with interactive menu
  drawPauseScreen(ctx, assets, level, player, soundManager) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Semi-transparent overlay with blur effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Main pause panel
    const panelWidth = 450;
    const panelHeight = 500;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Panel background with gradient
    const gradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(60, 70, 80, 0.95)');
    gradient.addColorStop(1, 'rgba(40, 50, 60, 0.95)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    
    // Panel border
    ctx.strokeStyle = '#4d4d4dff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText('GAME PAUSED', this.canvas.width / 2, panelY + 60);
    ctx.fillText('GAME PAUSED', this.canvas.width / 2, panelY + 60);
    
    // Current level info
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Level: ${level.name}`, this.canvas.width / 2, panelY + 100);
    
    // Game stats
    const totalFruits = level.getTotalFruitCount();
    const collectedFruits = level.getFruitCount();
    const deaths = player.deathCount || 0;
    const timeText = this.formatTime(this.getCurrentLevelTime());
    const soundSettings = soundManager.getSettings();
    
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#CCC';
    const statsY = panelY + 130;
    const statsSpacing = 25;
    
    ctx.fillText(`Fruits Collected: ${collectedFruits} / ${totalFruits}`, this.canvas.width / 2, statsY);
    ctx.fillText(`Deaths: ${deaths}`, this.canvas.width / 2, statsY + statsSpacing);
    ctx.fillText(`Time: ${timeText}`, this.canvas.width / 2, statsY + statsSpacing * 2);
    ctx.fillText(`Sound: ${soundSettings.enabled ? 'Enabled' : 'Disabled'} (${Math.round(soundSettings.volume * 100)}%)`, this.canvas.width / 2, statsY + statsSpacing * 3);
    
    // Menu buttons
    const buttonWidth = 200;
    const buttonHeight = 45;
    const buttonSpacing = 15;
    const buttonsStartY = panelY + 280;
    
    const buttons = [
      { text: 'Resume Game', action: 'resume', color: '#4CAF50', hotkey: 'ESC' },
      { text: 'Restart Level', action: 'restart', color: '#FF6B6B', hotkey: 'R' },
      { text: 'Settings', action: 'settings', color: '#2196F3', hotkey: 'S' },
      { text: 'Main Menu', action: 'mainmenu', color: '#9C27B0', hotkey: 'M' }
    ];
    
    buttons.forEach((button, index) => {
      const buttonX = (this.canvas.width - buttonWidth) / 2;
      const buttonY = buttonsStartY + index * (buttonHeight + buttonSpacing);
      
      // Button background with gradient
      const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
      buttonGradient.addColorStop(0, button.color);
      buttonGradient.addColorStop(1, this.darkenColor(button.color, 0.2));
      ctx.fillStyle = buttonGradient;
      
      ctx.beginPath();
      ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
      ctx.fill();
      
      // Button border
      ctx.strokeStyle = this.darkenColor(button.color, 0.3);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Button text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeText(button.text, this.canvas.width / 2, buttonY + 28);
      ctx.fillText(button.text, this.canvas.width / 2, buttonY + 28);
      
      // Hotkey indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.fillText(`[${button.hotkey}]`, this.canvas.width / 2, buttonY + 42);
    });
    
    // Instructions at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Click buttons or use hotkeys to navigate', this.canvas.width / 2, panelY + panelHeight - 20);
    
    ctx.restore();
  }

  // Handle clicks on pause screen
  handlePauseScreenClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Convert to canvas coordinates (matching the display scaling)
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const clickX = (event.clientX - rect.left) / displayWidth * this.canvas.width;
    const clickY = (event.clientY - rect.top) / displayHeight * this.canvas.height;
    
    // Pause panel dimensions
    const panelWidth = 450;
    const panelHeight = 500;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Button dimensions
    const buttonWidth = 200;
    const buttonHeight = 45;
    const buttonSpacing = 15;
    const buttonsStartY = panelY + 280;
    const buttonX = (this.canvas.width - buttonWidth) / 2;
    
    // Check which button was clicked
    const buttons = ['resume', 'restart', 'settings', 'mainmenu'];
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonY = buttonsStartY + i * (buttonHeight + buttonSpacing);
      
      if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
          clickY >= buttonY && clickY <= buttonY + buttonHeight) {
        return buttons[i];
      }
    }
    
    return null; // No button clicked
  }

  // Handle keyboard input on pause screen
  handlePauseScreenKeyboard(event) {
    const key = event.key.toLowerCase();
    
    switch(key) {
      case 'escape':
        return 'resume';
      case 'r':
        return 'restart';
      case 's':
        return 'settings';
      case 'm':
        return 'mainmenu';
      default:
        return null;
    }
  }

  // Utility function to darken colors
  darkenColor(color, amount) {
    // Simple color darkening - works with hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      
      const newR = Math.max(0, Math.floor(r * (1 - amount)));
      const newG = Math.max(0, Math.floor(g * (1 - amount)));
      const newB = Math.max(0, Math.floor(b * (1 - amount)));
      
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    // For other color formats, return the original
    return color;
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

  // Simple pause indicator (if you want to keep the old one too)
  drawPauseIndicator(ctx) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Pause text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    
    // Instructions
    ctx.font = '20px Arial';
    ctx.fillText('Press ESC or Pause button to resume', this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
}