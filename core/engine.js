import { Player } from '../entities/player.js';
import { Level } from '../entities/platform.js';
import { levelSections } from '../entities/levels.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';
import { HUD } from '../ui/hud.js';
import { GameState } from './game-state.js';
import { CollisionSystem } from './collision-system.js';
import { Renderer } from './renderer.js';

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds, callbacks = {}) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    this.pauseForMenu = false; // Differentiates menu pause from user pause
    this.callbacks = callbacks;

    this.lastCheckpoint = null; 

    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas);
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    this.collisionSystem = new CollisionSystem();
    this.renderer = new Renderer(ctx, canvas, assets);

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

    this.wasDashPressed = false;
  }

  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds };
  }

  getSoundManager() {
    return this.soundManager;
  }

  start() {
    this.isRunning = true;
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
    this.soundManager.stopAll();
  }

  pause() {
      this.isRunning = false;
      this.soundManager.stopAll();

      if (this.player) {
        this.player.needsRespawn = false;
      }
      
      this.render(); 
  }

  resume() {
    if (this.pauseForMenu) return; // Don't resume if a menu is open

    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }

    if (this.player) {
      this.player.needsRespawn = false;
    }
  }

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
        levelIndex >= levelSections[sectionIndex].levels.length) {
      console.error(`Invalid level: Section ${sectionIndex}, Level ${levelIndex}`);
      return;
    }

    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;
    this.currentLevel = new Level(levelSections[sectionIndex].levels[levelIndex]);

    this.collectedFruits = [];

    this.lastCheckpoint = null; // Reset the last checkpoint on level load
    
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

      // Update cooldown timers
      const inputActions = {
        moveLeft: this.keys[this.keybinds.moveLeft] || false,
        moveRight: this.keys[this.keybinds.moveRight] || false,
        jump: this.keys[this.keybinds.jump] || false,
        dash: this.keys[this.keybinds.dash] || false,
      };

      const dashJustPressed = inputActions.dash && !this.wasDashPressed;
      this.wasDashPressed = inputActions.dash;
      if (dashJustPressed && !this.player.isDashing && this.player.dashCooldownTimer <= 0) {
        this.soundManager.play('dash', 0.7);
      }

      this.player.handleInput(inputActions);
      this.player.update(dt, this.currentLevel);

      if (this.player.jumpedThisFrame === 1) {
        this.soundManager.play('jump', 0.8);
      } else if (this.player.jumpedThisFrame === 2) {
          this.soundManager.play('double_jump', 0.6);
      }
      this.player.jumpedThisFrame = 0; // Reset flag after checking

      this.camera.update(this.player, dt);

      if (this.player.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) {
        const respawnPosition = this.lastCheckpoint || this.currentLevel.startPosition;
        // Don't reset the whole level, just the player and fruits
        this.currentLevel.fruits.forEach(f => f.collected = false);
        this.player.respawn(respawnPosition);
        this.camera.shake(15, 0.5);
        this.soundManager.play('death_sound', 0.3);
        this.player.needsRespawn = false;
      }

      this.currentLevel.updateFruits(dt);
      this.currentLevel.updateTrophyAnimation(dt);
      this.currentLevel.updateCheckpoints(dt);
      
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
      
      const collisionResults = this.collisionSystem.update(
        this.player,
        this.currentLevel.getActiveFruits(),
        this.currentLevel.trophy,
        this.currentLevel.getInactiveCheckpoints()
      );

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

      if (collisionResults.checkpointCollision) {
          const cp = collisionResults.checkpointCollision;
          cp.state = 'activating';
          this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 }; // Respawn on top of the checkpoint
          this.soundManager.play('checkpoint_activated', 1); // Play the specific checkpoint sound

          // Deactivate other checkpoints to ensure only one is active
          this.currentLevel.checkpoints.forEach(otherCp => {
              if (otherCp !== cp && otherCp.state === 'active') {
                  otherCp.state = 'inactive';
                  otherCp.frame = 0; // Also reset its animation frame
              }
          });
      }

      if (collisionResults.trophyCollision && !this.player.isDespawning) {
        this.currentLevel.trophy.acquired = true;
        this.camera.shake(8, 0.3);
        this.player.startDespawn();
      }

      if (this.player.despawnAnimationFinished && !this.gameState.showingLevelComplete) {
        this.gameState.onLevelComplete();
        this.player.despawnAnimationFinished = false; // Reset flag
      }

    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }

    render() {
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.renderer.renderScene(
        this.camera,
        this.currentLevel,
        this.player,
        this.collectedFruits
      );

      this.hud.drawGameHUD(this.ctx, this.currentLevel, this.player, this.soundManager);

      if (this.gameState.showingLevelComplete) {
        this.hud.levelTime = this.levelTime;
        this.hud.drawLevelCompleteScreen(
          this.ctx, 
          this.currentLevel, 
          this.player, 
          this.assets, 
          this.gameState.hasNextLevel(),
          this.gameState.hasPreviousLevel(),
        );
      }

      if (!this.isRunning && !this.gameState.showingLevelComplete && !this.pauseForMenu) {
        this.hud.drawPauseScreen(this.ctx, this.currentLevel, this.player, this.assets, this.levelTime);
      }

    } catch (error) {
      console.error('Error in render loop:', error);
      this.ctx.fillStyle = 'red';
      this.ctx.font = '20px sans-serif';
      this.ctx.fillText('Rendering Error - Check Console', 10, 30);
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
          } else if (action === 'restart') {
              this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex);
              this.resume();
          } else if (action === 'main_menu') {
              if (this.callbacks.onMainMenu) {
                  this.callbacks.onMainMenu();
              }
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