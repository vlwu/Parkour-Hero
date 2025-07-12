// Fixed engine.js with improved sound integration

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
    
    // Initialize camera
    this.camera = new Camera(canvas.width, canvas.height);
    
    // Initialize sound manager with better error handling
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    
    // Audio context setup
    this.audioUnlocked = false;
    this.setupAudioUnlock();
    
    // Level progression system
    this.currentSection = 0;
    this.currentLevelIndex = 0;
    this.levelProgress = this.loadProgress();
    
    // Initialize the current level
    this.loadLevel(this.currentSection, this.currentLevelIndex);
    
    // Snap camera to player initial position
    this.camera.snapToPlayer(this.player);

    // Input handling
    this.initInput();
    
    // Jump sound tracking
    this.lastJumpTime = 0;
    this.jumpSoundCooldown = 100; // milliseconds

    console.log('Engine initialized successfully');
  }

  // Improved audio unlock system
  setupAudioUnlock() {
    const unlockAudio = () => {
      if (this.audioUnlocked) return;
      
      console.log('Unlocking audio context...');
      this.soundManager.enableAudioContext();
      this.audioUnlocked = true;
      
      // Test sound immediately after unlock
      setTimeout(() => {
        console.log('Testing jump sound after unlock...');
        this.soundManager.testSound('jump');
      }, 100);
      
      // Remove event listeners after first unlock
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    // Add event listeners for user interaction
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
  }

  // Improved jump detection system
  detectJumpSound(prevState, currentState) {
    const now = Date.now();
    
    // Cooldown check to prevent multiple rapid jump sounds
    if (now - this.lastJumpTime < this.jumpSoundCooldown) {
      return false;
    }
    
    // Check for jump initiation
    const wasOnGround = prevState.isOnGround;
    const isNowJumping = currentState.isJumping;
    const wasNotJumping = !prevState.isJumping;
    const velocityChanged = Math.abs(currentState.velocityY - prevState.velocityY) > 5;
    
    // Jump from ground
    if (wasOnGround && isNowJumping && wasNotJumping && velocityChanged) {
      this.lastJumpTime = now;
      return true;
    }
    
    // Double jump detection
    if (!wasOnGround && isNowJumping && wasNotJumping && velocityChanged) {
      this.lastJumpTime = now;
      return true;
    }
    
    // Wall jump detection
    if (currentState.isWallJumping && !prevState.isWallJumping) {
      this.lastJumpTime = now;
      return true;
    }
    
    return false;
  }

  // Load game progress (using in-memory storage)
  loadProgress() {
    // Using in-memory storage instead of localStorage
    if (this.gameProgress) {
      return this.gameProgress;
    }
    
    // Default progress
    this.gameProgress = {
      unlockedSections: 1,
      unlockedLevels: [1],
      completedLevels: []
    };
    
    return this.gameProgress;
  }

  // Save game progress (using in-memory storage)
  saveProgress() {
    // Store in memory instead of localStorage
    this.gameProgress = {
      unlockedSections: this.levelProgress.unlockedSections,
      unlockedLevels: this.levelProgress.unlockedLevels,
      completedLevels: this.levelProgress.completedLevels
    };
    console.log('Progress saved to memory:', this.gameProgress);
  }

  // Advance to next level
  advanceLevel() {
    // Mark current level as completed
    const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
    if (!this.levelProgress.completedLevels.includes(levelId)) {
      this.levelProgress.completedLevels.push(levelId);
    }

    // Play level complete sound
    console.log('Playing level complete sound...');
    this.soundManager.play('level_complete', 1.0);

    // Try to advance to next level in current section
    if (this.currentLevelIndex + 1 < levelSections[this.currentSection].length) {
      this.currentLevelIndex++;
      this.loadLevel(this.currentSection, this.currentLevelIndex);
    } else {
      // Try to advance to next section
      if (this.currentSection + 1 < levelSections.length) {
        this.currentSection++;
        this.currentLevelIndex = 0;
        this.loadLevel(this.currentSection, this.currentLevelIndex);
        
        // Update unlocked sections/levels
        if (this.currentSection >= this.levelProgress.unlockedSections) {
          this.levelProgress.unlockedSections = this.currentSection + 1;
        }
      } else {
        console.log('Game completed!');
      }
    }
  }

  // Update keybinds
  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds };
    console.log('Keybinds updated:', this.keybinds);
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
  }

  // Resume the game
  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }

  // Main game loop
  gameLoop(currentTime = 0) {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.016);
    this.lastFrameTime = currentTime;

    // Update and render
    this.update(deltaTime);
    this.render();

    // Continue the loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Initialize input handling
  initInput() {
    // Keydown handler
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.key.toLowerCase()] = true;
      
      // Unlock audio on first keypress
      if (!this.audioUnlocked) {
        this.setupAudioUnlock();
      }
      
      // Debug key for testing sounds
      if (e.key.toLowerCase() === 't') {
        console.log('Testing jump sound (T key)...');
        this.soundManager.forcePlay('jump', 0.8);
      }
    });

    // Keyup handler
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  loadLevel(sectionIndex, levelIndex) {
    // Validate indices
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
    
    // Initialize player
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets
    );
    
    // Update camera bounds for new level and snap to player
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

      // Store previous player state BEFORE update
      const prevState = {
        isJumping: this.player.isJumping,
        isOnGround: this.player.isOnGround,
        canJump: this.player.canJump,
        canDoubleJump: this.player.canDoubleJump,
        velocityY: this.player.velocityY,
        jumpKeyPressed: this.player.jumpKeyPressed,
        isWallJumping: this.player.isWallJumping || false
      };

      // Update player
      this.player.handleInput(inputActions);
      this.player.update(dt, this.canvas.height, this.currentLevel);

      // Get current player state AFTER update
      const currentState = {
        isJumping: this.player.isJumping,
        isOnGround: this.player.isOnGround,
        canJump: this.player.canJump,
        canDoubleJump: this.player.canDoubleJump,
        velocityY: this.player.velocityY,
        jumpKeyPressed: this.player.jumpKeyPressed,
        isWallJumping: this.player.isWallJumping || false
      };

      // Enhanced jump sound detection
      const jumpTriggered = this.detectJumpSound(prevState, currentState);
      if (jumpTriggered) {
        console.log('Jump detected! Playing sound...');
        this.soundManager.play('jump', 0.8);
      }

      // Update camera to follow player
      this.camera.update(this.player, dt);

      // Check if player needs to respawn
      if (this.player.needsRespawn) { 
        console.log('Player fell off, resetting level...');
        this.currentLevel.reset();
        this.player.respawn(this.currentLevel.startPosition);
        this.camera.shake(15, 0.5);
        this.player.deathCount = (this.player.deathCount || 0) + 1;
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
          
          console.log('Fruit collected! Playing sound...');
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
          
          console.log(`Collected ${fruit.spriteKey}! Total: ${this.currentLevel.getFruitCount()}`);
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
          console.log('Trophy acquired!');
        }
      }

      // Check level completion
      if (this.currentLevel.isCompleted()) {
        console.log('Level completed!');
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

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply camera transformation
      this.camera.apply(ctx);

      // Draw tiled background
      this.drawBackground();

      // Render level platforms and trophy
      this.currentLevel.render(ctx, assets);

      // Draw player
      this.player.render(ctx);

      // Draw fruits
      this.drawFruits();

      // Draw collected fruit animations
      this.drawCollectedFruits();

      // Restore camera transformation
      this.camera.restore(ctx);

      // Draw HUD
      this.drawHUD();

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
      console.warn('Background tile not loaded, using fallback');
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

    // Calculate visible tiles
    const startX = Math.floor(this.camera.x / tileSize);
    const startY = Math.floor(this.camera.y / tileSize);
    const endX = Math.ceil((this.camera.x + canvas.width) / tileSize);
    const endY = Math.ceil((this.camera.y + canvas.height) / tileSize);

    // Draw visible tiles
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

      // Only draw visible fruits
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
        if (i === 0) console.warn('Error drawing fruit:', error);
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
      
      // Only draw if visible
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
      // Save context
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const hudX = 10;
      const hudY = 10;
      const hudWidth = 280;
      const hudHeight = 120;

      // Draw HUD background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(hudX, hudY, hudWidth, hudHeight);

      const totalFruits = this.currentLevel.getTotalFruitCount();
      const collectedFruits = this.currentLevel.getFruitCount();
      const soundSettings = this.soundManager.getSettings();
      
      const lines = [
        `${this.currentLevel.name}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: ${this.player.deathCount || 0}`,
        `Sound: ${soundSettings.enabled ? 'ON' : 'OFF'} (${Math.round(soundSettings.volume * 100)}%)`,
        `Audio: ${this.audioUnlocked ? 'Unlocked' : 'Locked'} - Press T to test`
      ];

      ctx.font = '14px sans-serif';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'white';

      const lineHeight = 18;
      const totalTextHeight = lines.length * lineHeight;
      const startY = hudY + (hudHeight - totalTextHeight) / 2 + lineHeight - 6;
      const textX = hudX + 10;

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