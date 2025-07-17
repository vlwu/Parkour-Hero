// PIXI MIGRATION: Engine now manages PixiJS containers and sprites instead of a 2D context.
// Game loop is driven by app.ticker.
import * as PIXI from 'pixi.js';
import { Player } from '../entities/player.js';
import { levelSections } from '../entities/levels.js';
import { Level } from '../entities/platform.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';
import { HUD } from '../ui/hud.js';
import { GameState } from './game-state.js';
import { PhysicsSystem } from './physics-system.js';
import { Renderer } from './renderer.js'; // The new renderer will handle object creation
import { eventBus } from './event-bus.js';

export class Engine {
  constructor(app, assets, initialKeybinds) {
    this.app = app;
    this.assets = assets;
    this.keybinds = initialKeybinds;
    this.keys = {};
    this.isRunning = false;
    this.pauseForMenu = false;
    
    // PIXI MIGRATION: Create containers for different layers. This helps with camera and Z-ordering.
    this.worldContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.worldContainer, this.uiContainer);

    this.camera = new Camera(this.app.screen.width, this.app.screen.height);
    this.hud = new HUD(this.uiContainer, this.assets); // HUD is added to the static UI container
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets.sounds);
    this.physicsSystem = new PhysicsSystem();
    
    // PIXI MIGRATION: The new Renderer is now a factory for Pixi objects.
    this.renderer = new Renderer(this.worldContainer, this.assets);

    this.levelTime = 0;
    this.gameState = new GameState(levelSections);
    
    this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex);
    this.camera.snapTo(this.player.getCenterX(), this.player.getCenterY());

    this._setupEventSubscriptions();
  }
  
  _setupEventSubscriptions() {
    // Event subscriptions remain largely the same, their handlers are what change.
    eventBus.subscribe('requestLevelLoad', ({ sectionIndex, levelIndex }) => this.loadLevel(sectionIndex, levelIndex));
    eventBus.subscribe('requestLevelRestart', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('requestPauseToggle', () => this.togglePause());
    eventBus.subscribe('requestResume', () => this.resume());
    eventBus.subscribe('keybindsUpdated', (newKeybinds) => this.keybinds = { ...newKeybinds });
    eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
    eventBus.subscribe('trophyCollision', () => this._onTrophyCollision());
    eventBus.subscribe('checkpointActivated', (cp) => this._onCheckpointActivated(cp));
    eventBus.subscribe('createParticles', ({x, y, type, direction}) => this.renderer.createParticles(x, y, type, direction));
    eventBus.subscribe('playerDied', () => this._onPlayerDied());
    eventBus.subscribe('characterUpdated', (charId) => this.player.updateCharacter(charId));
    eventBus.subscribe('gamePaused', () => this.pause());
    eventBus.subscribe('menuOpened', () => this.pauseForMenu = true);
    eventBus.subscribe('allMenusClosed', () => this.pauseForMenu = false);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    // PIXI MIGRATION: Use app.ticker for the game loop
    this.app.ticker.add(this.gameLoop, this);
  }

  stop() {
    this.isRunning = false;
    this.app.ticker.remove(this.gameLoop, this);
    this.soundManager.stopAll();
  }

  togglePause() {
    this.isRunning ? this.pause() : this.resume();
  }

  pause() {
      if (!this.isRunning) return;
      this.isRunning = false;
      this.app.ticker.stop();
      this.soundManager.stopAll();
  }

  resume() {
    if (this.pauseForMenu) return;
    if (!this.isRunning) {
      this.isRunning = true;
      this.app.ticker.start();
    }
    eventBus.publish('gameResumed');
  }

  // PIXI MIGRATION: The gameLoop now receives the Ticker object from Pixi.
  gameLoop(ticker) {
    // Convert deltaMS to seconds for physics calculations
    const deltaTime = ticker.deltaMS / 1000;

    this.update(deltaTime);

    // PIXI MIGRATION: Rendering is now implicit. We just update the scene graph.
    // The camera's position is applied to the world container.
    this.camera.applyTo(this.worldContainer);
  }

  loadLevel(sectionIndex, levelIndex) {
    this.pauseForMenu = false;
    this.gameState.showingLevelComplete = false;
    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;
    this.currentLevel = new Level(levelSections[sectionIndex].levels[levelIndex]);
    
    // Clear the world for the new level
    this.renderer.clearWorld();

    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint = new Set();
    
    // Create player and add its sprite to the renderer
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets,
      this.gameState.selectedCharacter
    );
    this.renderer.addPlayer(this.player);

    // Let the renderer build the visual representation of the level
    this.renderer.buildLevel(this.currentLevel);

    this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
    this.camera.snapTo(this.player.getCenterX(), this.player.getCenterY());

    this.levelStartTime = performance.now();
    this.resume();
    eventBus.publish('levelLoaded', { gameState: this.gameState });
  }

  update(dt) {
    if (!this.isRunning) return;
      
    if (!this.gameState.showingLevelComplete) {
      this.levelTime = (performance.now() - this.levelStartTime) / 1000;
    }

    const inputActions = {
      moveLeft: this.keys[this.keybinds.moveLeft] || false,
      moveRight: this.keys[this.keybinds.moveRight] || false,
      jump: this.keys[this.keybinds.jump] || false,
      dash: this.keys[this.keybinds.dash] || false,
    };

    this.player.handleInput(inputActions);
    this.physicsSystem.update(this.player, this.currentLevel, dt, inputActions);
    
    // Update player and renderer (which updates sprites)
    this.player.update(dt);
    this.renderer.update(dt);
    
    this.camera.update(this.player, dt);

    if (this.player.needsRespawn) {
      this._respawnPlayer();
    }

    if (this.player.despawnAnimationFinished && !this.gameState.showingLevelComplete) {
      this.gameState.onLevelComplete();
      this.player.despawnAnimationFinished = false; 
      eventBus.publish('levelComplete', { deaths: this.player.deathCount, time: this.levelTime });
    }

    // Update HUD with latest stats
    this.hud.updateStats({
      levelName: this.currentLevel.name,
      collectedFruits: this.currentLevel.getFruitCount(),
      totalFruits: this.currentLevel.getTotalFruitCount(),
      deathCount: this.player.deathCount,
      levelTime: this.levelTime,
      soundEnabled: this.soundManager.settings.enabled,
      soundVolume: this.soundManager.settings.volume
    });
  }

  _respawnPlayer() {
    const respawnPosition = this.lastCheckpoint || this.currentLevel.startPosition;
    
    this.currentLevel.fruits.forEach((fruit, index) => {
        fruit.collected = this.fruitsAtLastCheckpoint.has(index);
    });
    this.currentLevel.recalculateCollectedFruits();
    this.renderer.syncFruits(this.currentLevel.fruits);

    this.player.respawn(respawnPosition);
    this.camera.shake(15, 0.5);
    eventBus.publish('playSound', { key: 'death_sound', volume: 0.3 });
  }

  _onFruitCollected(fruit) {
    this.currentLevel.collectFruit(fruit);
    this.renderer.showCollectedEffect(fruit);
    eventBus.publish('playSound', { key: 'collect', volume: 0.8 });
  }

  _onCheckpointActivated(cp) {
    cp.state = 'activating';
    this.renderer.updateCheckpoint(cp);
    this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 }; 
    eventBus.publish('playSound', { key: 'checkpoint_activated', volume: 1 });

    this.fruitsAtLastCheckpoint.clear();
    this.currentLevel.fruits.forEach((fruit, index) => {
        if (fruit.collected) this.fruitsAtLastCheckpoint.add(index);
    });
  }

  _onTrophyCollision() {
    if (!this.player.isDespawning) {
      this.currentLevel.trophy.acquired = true;
      this.renderer.updateTrophy(this.currentLevel.trophy);
      this.camera.shake(8, 0.3);
      this.player.startDespawn();
    }
  }

  _onPlayerDied() {
    if (!this.player.needsRespawn) {
      this.player.deathCount++;
      this.player.needsRespawn = true;
    }
  }
}