import { Player } from '../entities/player.js';
import { createLevel } from '../entities/platform.js'; 
import { levelSections } from '../entities/levels.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    
    this.camera = new Camera(canvas.width, canvas.height); // Initialize camera
    
    // Initialize sound manager
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    
    // Audio context setup
    this.audioUnlocked = false;
    this.setupAudioUnlock();
    
    // Level progression system
    this.currentSection = 0;
    this.currentLevelIndex = 0;
    this.levelProgress = this.loadProgress();
    this.showingLevelComplete = false;
    
    this.loadLevel(this.currentSection, this.currentLevelIndex); // Initialize the current level
    
    this.camera.snapToPlayer(this.player); // Snap camera to player initial position

    this.initInput();  // Input handling
    
    // Simplified jump tracking
    this.wasJumpPressed = false;
    this.lastJumpTime = 0;
    this.jumpCooldown = 150; // ms

    console.log('Engine initialized successfully');
  }

  // Audio unlock system
  setupAudioUnlock() {
    const unlockAudio = () => {
      if (this.audioUnlocked) return;
      
      this.soundManager.enableAudioContext();
      this.audioUnlocked = true;
      
      // Remove event listeners after first unlock
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
  }

  // Simplified jump detection - just check for jump key press transitions
  detectJumpSound(inputActions) {
    const now = Date.now();
    const jumpPressed = inputActions.jump;
    
    // Check if jump was just pressed (transition from false to true)
    const jumpJustPressed = jumpPressed && !this.wasJumpPressed;
    
    // Update state for next frame
    this.wasJumpPressed = jumpPressed;
    
    // If jump was just pressed and enough time has passed since last jump sound
    if (jumpJustPressed && (now - this.lastJumpTime) > this.jumpCooldown) {
      this.lastJumpTime = now;
      return true;
    }
    
    return false;
  }

  // Load game progress (using in-memory storage)
  loadProgress() {
    if (this.gameProgress) {
      return this.gameProgress;
    }
    
    this.gameProgress = {
      unlockedSections: 1,
      unlockedLevels: [1],
      completedLevels: []
    };
    
    return this.gameProgress;
  }

  // Save game progress (using in-memory storage)
  saveProgress() {
    this.gameProgress = {
      unlockedSections: this.levelProgress.unlockedSections,
      unlockedLevels: this.levelProgress.unlockedLevels,
      completedLevels: this.levelProgress.completedLevels
    };
  }

  // Advance to next level
  advanceLevel() {
    const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
    if (!this.levelProgress.completedLevels.includes(levelId)) {
      this.levelProgress.completedLevels.push(levelId);
    }

    this.soundManager.play('level_complete', 1.0);
    this.showingLevelComplete = true; // Show the completion screen
    this.pause(); // Pause the game
  }

  // Handle level complete screen actions
  handleLevelCompleteAction(action) {
    this.showingLevelComplete = false;

    // Clear any false respawn flags
    if (this.player) {
      this.player.needsRespawn = false;
    }
    
    if (action === 'next') {
      if (this.currentLevelIndex + 1 < levelSections[this.currentSection].length) {
        this.currentLevelIndex++;
        this.loadLevel(this.currentSection, this.currentLevelIndex);
      } else {
        if (this.currentSection + 1 < levelSections.length) {
          this.currentSection++;
          this.currentLevelIndex = 0;
          this.loadLevel(this.currentSection, this.currentLevelIndex);
          
          if (this.currentSection >= this.levelProgress.unlockedSections) {
            this.levelProgress.unlockedSections = this.currentSection + 1;
          }
        } else {
          console.log('Game completed!');
          return;
        }
      }
    } else if (action === 'restart') {
      this.restartLevel();
    }
    
    this.resume();
  }

  handleLevelCompleteClick(event) {
    if (!this.showingLevelComplete) return false;
    
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
    if (this.hasNextLevel()) {
      const nextButtonX = this.canvas.width / 2 - buttonWidth - 10;
      if (clickX >= nextButtonX && clickX <= nextButtonX + buttonWidth &&
          clickY >= buttonY && clickY <= buttonY + buttonHeight) {
        this.handleLevelCompleteAction('next');
        return true; // Consumed the click
      }
    }
    
    // Check Restart button
    const restartButtonX = this.canvas.width / 2 + 10;
    if (clickX >= restartButtonX && clickX <= restartButtonX + buttonWidth &&
        clickY >= buttonY && clickY <= buttonY + buttonHeight) {
      this.handleLevelCompleteAction('restart');
      return true; // Consumed the click
    }
    
    return false; // Click not consumed
  }

  // Check if there's a next level available
  hasNextLevel() {
    return (this.currentLevelIndex + 1 < levelSections[this.currentSection].length) ||
          (this.currentSection + 1 < levelSections.length);
  }

  // Update keybinds
  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds };
  }

  // Get sound manager
  getSoundManager() {
    return this.soundManager;
  }

  // Start the game loop
  start() {
    this.isRunning = true;
    this.gameLoop();
  }

  // Stop the game loop
  stop() {
    this.isRunning = false;
    this.soundManager.stopAll();
  }

  // Pause the game
  pause() {
    this.isRunning = false;
    this.soundManager.stopAll();

    // Clear respawn flag to prevent false deaths when resuming
    if (this.player) {
      this.player.needsRespawn = false;
    }
  }

  // Resume the game
  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      // Reset lastFrameTime to prevent large delta time jump
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }

    if (this.player) {
      this.player.needsRespawn = false;
    }
  }

  // Main game loop
  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) return;

    // Prevent large delta time jumps (like when resuming from pause)
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.016);
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Initialize input handling
  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.key.toLowerCase()] = true;
      
      if (!this.audioUnlocked) {
        this.setupAudioUnlock();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('click', (e) => {
      // Handle level complete screen clicks first
      if (this.handleLevelCompleteClick(e)) {
        return; // Don't process other click effects
      }
      
      if (!this.audioUnlocked) {
        this.setupAudioUnlock();
      }
    });
  }

  loadLevel(sectionIndex, levelIndex) {
    if (sectionIndex >= levelSections.length || 
        levelIndex >= levelSections[sectionIndex].length) {
      console.error(`Invalid level: Section ${sectionIndex}, Level ${levelIndex}`);
      return;
    }

    this.currentSection = sectionIndex;
    this.currentLevelIndex = levelIndex;
    this.currentLevel = createLevel(levelSections[sectionIndex][levelIndex]);
    this.fruits = this.currentLevel.fruits;
    this.fruitCount = 0;
    this.collectedFruits = [];
    
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets,
    );
    this.player.deathCount = 0 // Reset death count for new level

    this.camera.updateLevelBounds(this.currentLevel.width || 1280, this.currentLevel.height || 720);
    this.camera.snapToPlayer(this.player);
    
    console.log(`Loaded: ${this.currentLevel.name}`);
  }

  update(dt) {
    try {
      // Create input actions object
      const inputActions = {
        moveLeft: this.keys[this.keybinds.moveLeft] || false,
        moveRight: this.keys[this.keybinds.moveRight] || false,
        jump: this.keys[this.keybinds.jump] || false,
        dash: this.keys[this.keybinds.dash] || false,
      };

      // Check for jump sound before updating player
      const shouldPlayJumpSound = this.detectJumpSound(inputActions);
      if (shouldPlayJumpSound) {
        this.soundManager.play('jump', 0.8);
      }

      // Play dash sound effect 
      if (inputActions.dash && !this.player.isDashing && this.player.dashCooldownTimer <= 0) {
        this.soundManager.play('dash', 0.7);
      }

      // Update player
      this.player.handleInput(inputActions);
      this.player.update(dt, this.canvas.height, this.currentLevel);

      // Update camera to follow player
      this.camera.update(this.player, dt);

      // Check if player needs to respawn, death count is incremented in player.js
      if (this.player.needsRespawn && !this.showingLevelComplete && this.isRunning) { 
        this.currentLevel.reset();
        this.player.respawn(this.currentLevel.startPosition);
        this.camera.shake(15, 0.5);
        this.soundManager.play('death_sound'); // Play the death sound
        this.player.needsRespawn = false; // Reset the flag immediately
      }

      // Update level animations
      this.currentLevel.updateFruits(dt);
      this.currentLevel.updateTrophyAnimation(dt);

      // Update collected fruit animations
      this.collectedFruits = this.collectedFruits || [];
      for (const collected of this.collectedFruits) {
        collected.frameTimer += dt;
        if (collected.frameTimer >= collected.frameSpeed) {
          collected.frameTimer = 0;
          collected.frame++;
          if (collected.frame >= collected.collectedFrameCount) {
            collected.done = true;
          }
        }
      }
      this.collectedFruits = this.collectedFruits.filter(f => !f.done);

      // Fruit collection with sound
      this.currentLevel.fruits = this.currentLevel.fruits.filter((fruit) => {
        if (fruit.collected) return true;

        const dx = fruit.x - (this.player.x + this.player.width / 2);
        const dy = fruit.y - (this.player.y + this.player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collided = distance < (fruit.size / 2 + this.player.width / 2);

        if (collided) {
          fruit.collected = true;
          this.soundManager.play('collect', 0.8);

          this.collectedFruits.push({
            x: fruit.x,
            y: fruit.y,
            size: fruit.size,
            frame: 0,
            frameSpeed: 0.1,
            frameTimer: 0,
            collectedFrameCount: 6
          });
          
          return true;
        }

        return true;
      });

      // Trophy collision
      const trophy = this.currentLevel.trophy;
      if (trophy && !trophy.acquired && !trophy.inactive) {
        const px = this.player.x, py = this.player.y, pw = this.player.width, ph = this.player.height;
        const tx = trophy.x - trophy.size / 2, ty = trophy.y - trophy.size / 2, ts = trophy.size;

        if (px + pw > tx && px < tx + ts && py + ph > ty && py < ty + ts) {
          trophy.acquired = true;
          this.camera.shake(8, 0.3);
        }
      }

      // Skip other updates if showing level complete screen
      if (this.showingLevelComplete) {
        return;
      }

      // Check level completion
      if (this.currentLevel.isCompleted()) {
        this.saveProgress();
        this.advanceLevel();
      }

    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }

  render() {
    try {
      const { ctx, canvas, assets } = this;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.camera.apply(ctx);

      this.drawBackground();
      this.currentLevel.render(ctx, assets);
      this.player.render(ctx);
      this.drawFruits();
      this.drawCollectedFruits();

      this.camera.restore(ctx);
      this.drawHUD();

      if (this.showingLevelComplete) {
        this.drawLevelCompleteScreen();
      }

    } catch (error) {
      console.error('Error in render loop:', error);
      ctx.fillStyle = 'red';
      ctx.font = '20px sans-serif';
      ctx.fillText('Rendering Error - Check Console', 10, 30);
    }
  }

  drawBackground() {
    const { ctx, canvas, assets } = this;
    const bg = assets.backgroundTile;

    if (!bg) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      ctx.fillStyle = gradient;
      ctx.fillRect(this.camera.x, this.camera.y, canvas.width, canvas.height);
      return;
    }

    const spriteSize = 64;
    const tileSize = 64;
    const srcX = 0;
    const srcY = 0;

    const startX = Math.floor(this.camera.x / tileSize);
    const startY = Math.floor(this.camera.y / tileSize);
    const endX = Math.ceil((this.camera.x + canvas.width) / tileSize);
    const endY = Math.ceil((this.camera.y + canvas.height) / tileSize);

    for (let i = startX; i <= endX; i++) {
      const x = i * tileSize;
      for (let j = startY; j <= endY; j++) {
        const y = j * tileSize;
        try {
          ctx.drawImage(
            bg,
            srcX, srcY,
            spriteSize, spriteSize,
            x, y,
            tileSize, tileSize
          );
        } catch (error) {
          if (i === startX && j === startY) {
            console.warn('Failed to draw background tile:', error);
          }
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }

  drawFruits() {
    const { ctx, assets } = this;
    const fruits = this.currentLevel.fruits;
    
    for (let i = 0, len = fruits.length; i < len; i++) {
      const fruit = fruits[i];
      if (fruit.collected) continue;

      if (!this.camera.isVisible(fruit.x - fruit.size/2, fruit.y - fruit.size/2, fruit.size, fruit.size)) {
        continue;
      }

      try {
        const img = assets[fruit.spriteKey];
        if (!img) {
          ctx.fillStyle = '#FF6B6B';
          ctx.beginPath();
          ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        const frameWidth = img.width / fruit.frameCount;
        const srcX = frameWidth * fruit.frame;

        ctx.drawImage(
          img,
          srcX, 0, frameWidth, img.height,
          fruit.x - fruit.size / 2, fruit.y - fruit.size / 2,
          fruit.size, fruit.size
        );

      } catch (error) {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawCollectedFruits() {
    const { ctx, assets } = this;
    const collectedArr = this.collectedFruits;
    const sprite = assets['fruit_collected'];
    
    if (!sprite) return;

    const frameWidth = sprite.width / 6;
    const frameHeight = sprite.height;
    
    for (let i = 0, len = collectedArr.length; i < len; i++) {
      const collected = collectedArr[i];
      
      if (!this.camera.isVisible(collected.x - collected.size/2, collected.y - collected.size/2, collected.size, collected.size)) {
        continue;
      }
      
      const srcX = collected.frame * frameWidth;
      ctx.drawImage(
        sprite,
        srcX, 0,
        frameWidth, frameHeight,
        collected.x - collected.size / 2, collected.y - collected.size / 2,
        collected.size, collected.size
      );
    }
  }

  drawHUD() {
    const { ctx } = this;

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

      const totalFruits = this.currentLevel.getTotalFruitCount();
      const collectedFruits = this.currentLevel.getFruitCount();
      const soundSettings = this.soundManager.getSettings();
      
      const lines = [
        `${this.currentLevel.name}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: ${this.player.deathCount || 0}`,
        `Sound: ${soundSettings.enabled ? 'ON' : 'OFF'} (${Math.round(soundSettings.volume * 100)}%)`
      ];

      ctx.font = '16px sans-serif';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'white';

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

drawLevelCompleteScreen() {
    const { ctx, canvas, assets } = this;
    
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Main panel
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = (canvas.height - panelHeight) / 2;
    
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
    ctx.fillText('Level Complete!', canvas.width / 2, panelY + 60);
    
    // Stats
    const totalFruits = this.currentLevel.getTotalFruitCount();
    const collectedFruits = this.currentLevel.getFruitCount();
    const deaths = this.player.deathCount || 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Time Taken: placeholder`, canvas.width / 2, panelY + 120);
    ctx.fillText(`Deaths: ${deaths}`, canvas.width / 2, panelY + 150);
    
    // Buttons
    const buttonWidth = 40;
    const buttonHeight = 40;
    const buttonY = panelY + 200;
    
    if (this.hasNextLevel()) {
      // Next Level button
      const nextButtonX = canvas.width / 2 - buttonWidth - 10;
      
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
    const restartButtonX = canvas.width / 2 + 10;
    
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

  // Get camera for external access
  getCamera() {
    return this.camera;
  }

  // Manual screen shake
  shakeScreen(intensity = 10, duration = 0.2) {
    this.camera.shake(intensity, duration);
  }

  // Restart current level
  restartLevel() {
    this.loadLevel(this.currentSection, this.currentLevelIndex);
  }
}