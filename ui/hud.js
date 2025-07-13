export class HUD {
  constructor() {
    this.fontSize = 20;
    this.fontFamily = 'Arial, sans-serif';
    this.textColor = '#ffffff';
    this.shadowColor = '#000000';
    this.shadowOffset = 2;
    this.padding = 20;
  }

  render(ctx, gameState, soundManager) {
    try {
      const player = gameState.getPlayer();
      const currentLevel = gameState.getCurrentLevel();
      
      if (!player || !currentLevel) return;

      // Save context
      ctx.save();

      // Set font and text properties
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Render level name
      this.renderText(ctx, `Level: ${currentLevel.name}`, this.padding, this.padding);

      // Render fruit count
      const totalFruits = currentLevel.fruits ? currentLevel.fruits.length : 0;
      const collectedFruits = gameState.getCollectedFruits().length;
      this.renderText(ctx, `Fruits: ${collectedFruits}/${totalFruits}`, this.padding, this.padding + 30);

      // Render death count
      this.renderText(ctx, `Deaths: ${player.deathCount}`, this.padding, this.padding + 60);

      // Render dash cooldown indicator
      if (player.dashCooldownTimer > 0) {
        const cooldownPercent = (player.dashCooldownTimer / player.dashCooldown) * 100;
        this.renderText(ctx, `Dash: ${Math.ceil(cooldownPercent)}%`, this.padding, this.padding + 90);
      } else {
        this.renderText(ctx, 'Dash: Ready', this.padding, this.padding + 90);
      }

      // Render jump count indicator
      const jumpsRemaining = Math.max(0, 2 - player.jumpCount);
      this.renderText(ctx, `Jumps: ${jumpsRemaining}`, this.padding, this.padding + 120);

      // Render audio status if sound manager is available
      if (soundManager) {
        const audioStatus = soundManager.audioContext && soundManager.audioContext.state === 'running' ? 'ON' : 'OFF';
        this.renderText(ctx, `Audio: ${audioStatus}`, this.padding, this.padding + 150);
      }

      // Render player state for debugging (optional)
      if (player.state) {
        this.renderText(ctx, `State: ${player.state}`, this.padding, this.padding + 180);
      }

      // Restore context
      ctx.restore();

    } catch (error) {
      console.error('Error rendering HUD:', error);
    }
  }

  renderText(ctx, text, x, y) {
    // Draw text shadow
    ctx.fillStyle = this.shadowColor;
    ctx.fillText(text, x + this.shadowOffset, y + this.shadowOffset);
    
    // Draw main text
    ctx.fillStyle = this.textColor;
    ctx.fillText(text, x, y);
  }

  // Method to update HUD settings if needed
  updateSettings(settings) {
    if (settings.fontSize) this.fontSize = settings.fontSize;
    if (settings.fontFamily) this.fontFamily = settings.fontFamily;
    if (settings.textColor) this.textColor = settings.textColor;
    if (settings.shadowColor) this.shadowColor = settings.shadowColor;
    if (settings.shadowOffset) this.shadowOffset = settings.shadowOffset;
    if (settings.padding) this.padding = settings.padding;
  }
}