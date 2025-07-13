import { Player } from '../entities/player.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';
import { GameState } from './game-state.js';
import { InputManager } from './input-manager.js';
import { LevelCompleteScreen } from '../ui/level-complete-screen.js';
import { HUD } from '../ui/hud.js';
import { Renderer } from './renderer.js';
import { CollisionManager } from './collision-manager.js';

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.isRunning = false;
    
    // Initialize core systems
    this.gameState = new GameState();
    this.inputManager = new InputManager(initialKeybinds);
    this.soundManager = new SoundManager();
    this.camera = new Camera(canvas.width, canvas.height);
    this.renderer = new Renderer(ctx, canvas, assets, this.camera);
    this.collisionManager = new CollisionManager();
    
    // Initialize UI systems
    this.levelCompleteScreen = new LevelCompleteScreen(canvas);
    this.hud = new HUD();
    
    // Setup audio
    this.soundManager.loadSounds(assets);
    this.inputManager.setAudioUnlockCallback(() => {
      this.soundManager.enableAudioContext();
    });
    
    // Load initial level
    this.gameState.loadLevel(0, 0, Player, assets);
    this.updateCameraForLevel();
    
    // Setup event listeners
    this.initEventListeners();
    
    console.log('Engine initialized successfully');
  }

  initEventListeners() {
    window.addEventListener('click', (e) => {
      if (this.gameState.isShowingLevelComplete()) {
        const action = this.levelCompleteScreen.handleClick(e, this.gameState.hasNextLevel());
        if (action) {
          this.handleLevelCompleteAction(action);
        }
      }
    });
  }

  handleLevelCompleteAction(action) {
    const nextLevel = this.gameState.handleLevelCompleteAction(action);
    
    if (nextLevel) {
      this.gameState.loadLevel(nextLevel.section, nextLevel.level, Player, this.assets);
      this.updateCameraForLevel();
    }
    
    this.resume();
  }

  updateCameraForLevel() {
    const currentLevel = this.gameState.getCurrentLevel();
    const player = this.gameState.getPlayer();
    
    if (currentLevel && player) {
      this.camera.updateLevelBounds(
        currentLevel.width || 1280, 
        currentLevel.height || 720
      );
      this.camera.snapToPlayer(player);
    }
  }

  // Public API methods
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
    
    const player = this.gameState.getPlayer();
    if (player) {
      player.needsRespawn = false;
    }
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }
    
    const player = this.gameState.getPlayer();
    if (player) {
      player.needsRespawn = false;
    }
  }

  updateKeybinds(newKeybinds) {
    this.inputManager.updateKeybinds(newKeybinds);
  }

  getSoundManager() {
    return this.soundManager;
  }

  getCamera() {
    return this.camera;
  }

  shakeScreen(intensity = 10, duration = 0.2) {
    this.camera.shake(intensity, duration);
  }

  restartLevel() {
    const current = this.gameState.restartLevel();
    this.gameState.loadLevel(current.section, current.level, Player, this.assets);
    this.updateCameraForLevel();
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

  update(dt) {
    try {
      const inputActions = this.inputManager.getInputActions();
      const player = this.gameState.getPlayer();
      const currentLevel = this.gameState.getCurrentLevel();
      
      if (!player || !currentLevel) return;

      // Handle audio
      if (this.inputManager.detectJumpSound(inputActions)) {
        this.soundManager.play('jump', 0.8);
      }
      
      if (inputActions.dash && !player.isDashing && player.dashCooldownTimer <= 0) {
        this.soundManager.play('dash', 0.7);
      }

      // Update player
      player.handleInput(inputActions);
      player.update(dt, this.canvas.height, currentLevel);

      // Update camera
      this.camera.update(player, dt);

      // Handle respawn
      if (player.needsRespawn && !this.gameState.isShowingLevelComplete() && this.isRunning) {
        currentLevel.reset();
        player.respawn(currentLevel.startPosition);
        this.camera.shake(15, 0.5);
        this.soundManager.play('death_sound');
        player.needsRespawn = false;
      }

      // Update level animations
      currentLevel.updateFruits(dt);
      currentLevel.updateTrophyAnimation(dt);

      // Handle collisions
      this.collisionManager.updateCollisions(this.gameState, this.soundManager, this.camera);

      // Skip other updates if showing level complete screen
      if (this.gameState.isShowingLevelComplete()) {
        return;
      }

      // Check level completion
      if (currentLevel.isCompleted()) {
        this.gameState.saveProgress();
        this.gameState.advanceLevel();
        this.soundManager.play('level_complete', 1.0);
        this.pause();
      }

    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }

  render() {
    try {
      this.renderer.render(this.gameState);
      this.hud.render(this.ctx, this.gameState, this.soundManager);
      
      if (this.gameState.isShowingLevelComplete()) {
        this.levelCompleteScreen.render(this.ctx, this.gameState, this.assets);
      }
    } catch (error) {
      console.error('Error in render loop:', error);
      this.ctx.fillStyle = 'red';
      this.ctx.font = '20px sans-serif';
      this.ctx.fillText('Rendering Error - Check Console', 10, 30);
    }
  }
}