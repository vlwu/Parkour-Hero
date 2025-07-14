import { Player } from '../entities/player.js';
import { createLevel } from '../entities/platform.js'; 
import { levelSections } from '../entities/levels.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';
import { HUD } from '../ui/hud.js';
import { GameState } from './game-state.js';

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    
    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas); // Initialize HUD
    
    // Initialize sound manager
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    
    // Audio context setup
    this.audioUnlocked = false;
    this.setupAudioUnlock();
    
    // Level progression system
    this.gameState = new GameState(levelSections);

    // Pause system flags
    this.pauseForSettings = false; // Flag to track if paused for settings modal
    this.showingPauseScreen = false; // Flag to track if showing pause screen

    this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex);
    this.camera.snapToPlayer(this.player);

    this.initInput();
    
    // Simplified jump tracking
    this.wasJumpPressed = false;
    this.lastJumpTime = 0;
    this.jumpCooldown = 100; // ms

    this.wasDashPressed = false;

    // Level timer
    this.levelStartTime = 0;
    this.levelTime = 0;
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

  // Simplified jump detection
  detectJumpSound(inputActions) {
      const now = Date.now();
      const jumpPressed = inputActions.jump;
      
      // Only trigger on key press (not hold)
      const jumpJustPressed = jumpPressed && !this.wasJumpPressed;
      this.wasJumpPressed = jumpPressed;

      // Don't play sounds if jump wasn't just pressed or is on cooldown
      if (!jumpJustPressed || (now - this.lastJumpTime) < this.jumpCooldown) {
          return null;
      }

      // Ground jump sound
      if (this.player.onGround || this.player.jumpCount === 0) {
          this.lastJumpTime = now;
          return { type: 'first' };
      }
      // Double jump sound
      else if (this.player.jumpCount === 1 && !this.player.onGround) {
          this.lastJumpTime = now;
          return { type: 'second' };
      }

      return null;
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

  // Pause the game - enhanced to work with pause screen system
  pause() {
    this.isRunning = false;
    this.soundManager.stopAll();

    if (this.player) {
      this.player.needsRespawn = false;
    }
  }

  // Resume the game - enhanced to work with pause screen system
  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }

    if (this.player) {
      this.player.needsRespawn = false;
      this.player.onGround = true; 
    }
  }

  // Check if the game is paused (including settings modal)
  isPaused() {
    return !this.isRunning || this.pauseForSettings || this.showingPauseScreen;
  }

  // Set pause screen state
  setPauseScreenState(showing) {
    this.showingPauseScreen = showing;
  }

  // Main game loop
  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) return;

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
      if (this.gameState.handleLevelCompleteClick(e)) {
        return;
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

    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;
    this.currentLevel = createLevel(levelSections[sectionIndex][levelIndex]);
    this.fruits = this.currentLevel.fruits;
    this.fruitCount = 0;
    this.collectedFruits = [];
    
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets,
    );
    this.player.isSpawning = true;
    this.player.spawnComplete = false;
    this.player.state = 'spawn';
    this.player.deathCount = 0;

    this.camera.updateLevelBounds(this.currentLevel.width || 1280, this.currentLevel.height || 720);
    this.camera.snapToPlayer(this.player);

    // === BIND gameState dependencies AFTER player/hud are ready ===
    this.levelStartTimeRef = { value: this.levelStartTime };
    this.levelTimeRef = { value: this.levelTime };

    this.gameState.bindDependencies({
      player: this.player,
      soundManager: this.soundManager,
      hud: this.hud,
      pause: this.pause.bind(this),
      resume: this.resume.bind(this),
      loadLevel: this.loadLevel.bind(this),
      getLevelStartTimeRef: () => this.levelStartTimeRef,
      getLevelTimeRef: () => this.levelTimeRef
    });

    // Actually initialize the start time here
    this.levelStartTime = performance.now();
    this.levelStartTimeRef.value = this.levelStartTime;
}

  update(dt) {
    try {
      // Update level timer only if not paused and not showing level complete
      if (this.isRunning && !this.gameState.showingLevelComplete && !this.showingPauseScreen) {
        this.levelTimeRef.value = (performance.now() - this.levelStartTimeRef.value) / 1000;
        this.levelTime = this.levelTimeRef.value; // optional; only needed if you reference this.levelTime elsewhere
      }

      // Skip game logic updates if paused (but still allow level complete screen updates)
      if (this.showingPauseScreen) {
        return;
      }

      // Create input actions object
      const inputActions = {
        moveLeft: this.keys[this.keybinds.moveLeft] || false,
        moveRight: this.keys[this.keybinds.moveRight] || false,
        jump: this.keys[this.keybinds.jump] || false,
        dash: this.keys[this.keybinds.dash] || false,
      };

      // Check for jump sound before updating player
      const jumpSoundInfo = this.detectJumpSound(inputActions);
      if (jumpSoundInfo) {
        if (jumpSoundInfo.type === 'first') {
          this.soundManager.play('jump', 0.8);
        } else if (jumpSoundInfo.type === 'second') {
          this.soundManager.play('double_jump', 0.8);
        }
      }

      // Play dash sound effect 
      const dashJustPressed = inputActions.dash && !this.wasDashPressed;
      this.wasDashPressed = inputActions.dash;

      if (dashJustPressed && !this.player.isDashing && this.player.dashCooldownTimer <= 0) {
        this.soundManager.play('dash', 0.7);
      }

      // Update player
      this.player.handleInput(inputActions);
      this.player.update(dt, this.canvas.height, this.currentLevel);

      // Update camera to follow player
      this.camera.update(this.player, dt);

      // Check if player needs to respawn
      if (this.player.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) { 
        this.currentLevel.reset();
        this.player.respawn(this.currentLevel.startPosition);
        this.camera.shake(15, 0.5);
        this.soundManager.play('death_sound', 0.3);
        this.player.needsRespawn = false;
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
      if (this.gameState.showingLevelComplete) {
        return;
      }

      if (this.currentLevel.isCompleted()) {
        this.gameState.saveProgress();
        this.gameState.advanceLevel();
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
      
      // Use HUD class for rendering
      this.hud.drawGameHUD(ctx, this.currentLevel, this.player, this.soundManager);

      if (this.gameState.showingLevelComplete) {
        this.hud.levelTime = this.levelTime; // Pass level time to HUD
        this.hud.drawLevelCompleteScreen(
          ctx, 
          this.currentLevel, 
          this.player, 
          this.assets, 
          this.gameState.hasNextLevel(),
          this.gameState.hasPreviousLevel(),
        );
      }

      // Draw pause indicator only if paused but not showing enhanced pause screen
      if (!this.isRunning && !this.gameState.showingLevelComplete && !this.showingPauseScreen) {
        this.hud.drawPauseIndicator(ctx);
      }

      // Note: The enhanced pause screen is now rendered in main.js through the custom render callback

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

  // Get camera for external access
  getCamera() {
    return this.camera;
  }

  // Manual screen shake
  shakeScreen(intensity = 10, duration = 0.2) {
    this.camera.shake(intensity, duration);
  }
}