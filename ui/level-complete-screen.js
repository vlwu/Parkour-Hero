export class LevelCompleteScreen {
  constructor(canvas) {
    this.canvas = canvas;
    this.panelWidth = 400;
    this.panelHeight = 300;
    this.buttonWidth = 40;
    this.buttonHeight = 40;
  }

  handleClick(event, hasNextLevel) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const panelX = (this.canvas.width - this.panelWidth) / 2;
    const panelY = (this.canvas.height - this.panelHeight) / 2;
    const buttonY = panelY + 200;
    
    // Check Next Level button (if available)
    if (hasNextLevel) {
      const nextButtonX = this.canvas.width / 2 - this.buttonWidth - 10;
      if (clickX >= nextButtonX && clickX <= nextButtonX + this.buttonWidth &&
          clickY >= buttonY && clickY <= buttonY + this.buttonHeight) {
        return 'next';
      }
    }
    
    // Check Restart button
    const restartButtonX = this.canvas.width / 2 + 10;
    if (clickX >= restartButtonX && clickX <= restartButtonX + this.buttonWidth &&
        clickY >= buttonY && clickY <= buttonY + this.buttonHeight) {
      return 'restart';
    }
    
    return null;
  }

  render(ctx, gameState, assets) {
    const { canvas } = this;
    
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Main panel
    const panelX = (canvas.width - this.panelWidth) / 2;
    const panelY = (canvas.height - this.panelHeight) / 2;
    
    ctx.fillStyle = 'rgba(50, 50, 50, 0.95)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, this.panelWidth, this.panelHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Title
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', canvas.width / 2, panelY + 60);
    
    // Stats
    const currentLevel = gameState.getCurrentLevel();
    const player = gameState.getPlayer();
    const totalFruits = currentLevel.getTotalFruitCount();
    const collectedFruits = currentLevel.getFruitCount();
    const deaths = player.deathCount || 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Time Taken: placeholder`, canvas.width / 2, panelY + 120);
    ctx.fillText(`Deaths: ${deaths}`, canvas.width / 2, panelY + 150);
    
    // Buttons
    const buttonY = panelY + 200;
    
    if (gameState.hasNextLevel()) {
      this.renderNextButton(ctx, canvas.width / 2 - this.buttonWidth - 10, buttonY, assets);
    }
    
    this.renderRestartButton(ctx, canvas.width / 2 + 10, buttonY, assets);
    
    ctx.restore();
  }

  renderNextButton(ctx, x, y, assets) {
    const nextButtonImage = assets.next_level_button;
    if (nextButtonImage) {
      ctx.drawImage(nextButtonImage, x, y, this.buttonWidth, this.buttonHeight);
    } else {
      // Fallback rectangle if image not loaded
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(x, y, this.buttonWidth, this.buttonHeight);
      ctx.fillStyle = 'white';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Next Level', x + this.buttonWidth / 2, y + 25);
    }
  }

  renderRestartButton(ctx, x, y, assets) {
    const restartButtonImage = assets.restart_level_button;
    if (restartButtonImage) {
      ctx.drawImage(restartButtonImage, x, y, this.buttonWidth, this.buttonHeight);
    } else {
      // Fallback rectangle if image not loaded
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(x, y, this.buttonWidth, this.buttonHeight);
      ctx.fillStyle = 'white';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Restart', x + this.buttonWidth / 2, y + 25);
    }
  }
}