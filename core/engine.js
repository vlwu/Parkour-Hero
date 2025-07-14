// core/engine.js

import { Player } from '../entities/player.js';
import { createLevel } from '../entities/platform.js';
import { levelSections } from '../entities/levels.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';
import { HUD } from '../ui/hud.js';
import { GameState } from './game-state.js';
import { CollisionSystem } from './collision-system.js'; // Import the new system

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    this.pauseForSettings = false;

    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas);
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    this.collisionSystem = new CollisionSystem(); // Instantiate the new system

    this.levelStartTime = 0;
    this.levelTime = 0;

    this.gameState = new GameState(levelSections, {
      loadLevel: this.loadLevel.bind(this),
      pause: this.pause.bind(this),
      resume: this.resume.bind(this),
      getEngineState: () => ({
        player: this.player,
        soundManager: this.soundManager,
        hud: this.hud,
        levelTime: this.levelTime
      })
    });
    
    this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex);
    this.camera.snapToPlayer(this.player);

    this.wasJumpPressed = false;
    this.lastJumpTime = 0;
    this.jumpCooldown = 100;
    this.wasDashPressed = false;
  }

  // ... (detectJumpSound, updateKeybinds, getSoundManager, start, stop, pause, resume, gameLoop, loadLevel methods are unchanged) ...
  // detectJumpSound
  detectJumpSound(inputActions) {
      const now = Date.now();
      const jumpPressed = inputActions.jump;
      
      const jumpJustPressed = jumpPressed && !this.wasJumpPressed;
      this.wasJumpPressed = jumpPressed;

      if (!jumpJustPressed || (now - this.lastJumpTime) < this.jumpCooldown) {
          return null;
      }

      if (this.player.onGround || this.player.jumpCount === 0) {
          this.lastJumpTime = now;
          return { type: 'first' };
      }
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

  // Pause the game
  pause() {
      this.isRunning = false;
      this.soundManager.stopAll();

      if (this.player) {
        this.player.needsRespawn = false;
      }
      
      this.render(); 
  }

  // Resume the game
  resume() {
    if (this.pauseForSettings) return; 

    if (!this.isRunning) {
      this.isRunning = true;
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

    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.016);
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
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

    this.levelStartTime = performance.now();
}


  update(dt) {
    try {
      if (this.isRunning && !this.gameState.showingLevelComplete) {
        this.levelTime = (performance.now() - this.levelStartTime) / 1000;
      }

      const inputActions = {
        moveLeft: this.keys[this.keybinds.moveLeft] || false,
        moveRight: this.keys[this.keybinds.moveRight] || false,
        jump: this.keys[this.keybinds.jump] || false,
        dash: this.keys[this.keybinds.dash] || false,
      };

      const jumpSoundInfo = this.detectJumpSound(inputActions);
      if (jumpSoundInfo) {
        if (jumpSoundInfo.type === 'first') this.soundManager.play('jump', 0.8);
        else if (jumpSoundInfo.type === 'second') this.soundManager.play('double_jump', 0.8);
      }

      const dashJustPressed = inputActions.dash && !this.wasDashPressed;
      this.wasDashPressed = inputActions.dash;
      if (dashJustPressed && !this.player.isDashing && this.player.dashCooldownTimer <= 0) {
        this.soundManager.play('dash', 0.7);
      }

      this.player.handleInput(inputActions);
      this.player.update(dt, this.canvas.height, this.currentLevel);
      this.camera.update(this.player, dt);

      if (this.player.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) {
        this.currentLevel.reset();
        this.player.respawn(this.currentLevel.startPosition);
        this.camera.shake(15, 0.5);
        this.soundManager.play('death_sound', 0.3);
        this.player.needsRespawn = false;
      }

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

      // --- COLLISION LOGIC IS NOW DELEGATED ---
      const collisionResults = this.collisionSystem.update(this.player, this.currentLevel);

      // Handle fruit collection consequences
      if (collisionResults.newlyCollectedFruits.length > 0) {
        for (const fruit of collisionResults.newlyCollectedFruits) {
          fruit.collected = true;
          this.soundManager.play('collect', 0.8);

          this.collectedFruits.push({
            x: fruit.x, y: fruit.y, size: fruit.size, frame: 0,
            frameSpeed: 0.1, frameTimer: 0, collectedFrameCount: 6
          });
        }
      }

      // Handle trophy collision consequences
      if (collisionResults.trophyCollision) {
        this.currentLevel.trophy.acquired = true;
        this.camera.shake(8, 0.3);
      }
      // --- END OF DELEGATED COLLISION LOGIC ---

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

  // ... (render and other methods are unchanged) ...
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
      
      this.hud.drawGameHUD(ctx, this.currentLevel, this.player, this.soundManager);

      if (this.gameState.showingLevelComplete) {
        this.hud.levelTime = this.levelTime;
        this.hud.drawLevelCompleteScreen(
          ctx, 
          this.currentLevel, 
          this.player, 
          this.assets, 
          this.gameState.hasNextLevel(),
          this.gameState.hasPreviousLevel(),
        );
      }

      if (!this.isRunning && !this.gameState.showingLevelComplete && !this.pauseForSettings) {
        this.hud.drawPauseScreen(ctx);
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

  handleCanvasClick(x, y) {
      if (this.gameState.showingLevelComplete) {
          const action = this.hud.handleLevelCompleteClick(x, y, this.gameState.hasNextLevel(), this.gameState.hasPreviousLevel());
          if (action) {
              this.gameState.handleLevelCompleteAction(action);
          }
      } else if (!this.isRunning) {
          const action = this.hud.handlePauseScreenClick(x, y);
          if (action === 'resume') {
              this.resume();
          }
      }
  }

  handleKeyEvent(key, isDown) {
      this.keys[key] = isDown;
  }

  getCamera() {
    return this.camera;
  }

  shakeScreen(intensity = 10, duration = 0.2) {
    this.camera.shake(intensity, duration);
  }
}