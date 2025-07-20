import { Player } from '../entities/player.js';
import { Camera } from './camera.js';
import { SoundManager } from '../managers/sound-manager.js';
import { HUD } from '../ui/hud.js';
import { GameState } from '../managers/game-state.js';
import { PhysicsSystem } from '../systems/physics-collision-system.js';
import { Renderer } from '../systems/renderer.js';
import { LevelManager } from '../managers/level-manager.js';
import { eventBus } from '../utils/event-bus.js';
import { ParticleSystem } from '../systems/particle-system.js';
import { UISystem } from '../ui/ui-system.js';
import { inputState } from '../systems/input-state.js';

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds, fontRenderer) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.fontRenderer = fontRenderer;
    this.lastFrameTime = 0;
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    this.gameHasStarted = false;
    this.pauseForMenu = false;

    this.lastCheckpoint = null; 
    this.fruitsAtLastCheckpoint = new Set();

    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas, this.fontRenderer);
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    this.renderer = new Renderer(ctx, canvas, assets);
    this.gameState = new GameState();
    this.levelManager = new LevelManager(this.gameState); 

    // --- Systems ---
    this.physicsSystem = new PhysicsSystem();
    this.particleSystem = new ParticleSystem(assets);
    this.uiSystem = new UISystem(canvas, assets);
    this.systems = [this.physicsSystem, this.particleSystem, this.uiSystem];

    this.levelStartTime = 0;
    this.levelTime = 0;
    this.currentLevel = null;
    this.collectedFruits = [];
    this.menuManager = null;

    this._setupEventSubscriptions();
  }
  
  _setupEventSubscriptions() {
    eventBus.subscribe('requestStartGame', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('requestLevelLoad', ({ sectionIndex, levelIndex }) => this.loadLevel(sectionIndex, levelIndex));
    eventBus.subscribe('requestLevelRestart', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('requestResume', () => this.resume());
    eventBus.subscribe('requestPause', () => this.pause());
    eventBus.subscribe('keybindsUpdated', (newKeybinds) => this.updateKeybinds(newKeybinds));
    
    eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
    eventBus.subscribe('trophyCollision', () => this._onTrophyCollision());
    eventBus.subscribe('checkpointActivated', (cp) => this._onCheckpointActivated(cp));
    eventBus.subscribe('playerDied', () => this._onPlayerDied());
    eventBus.subscribe('characterUpdated', (charId) => this.updatePlayerCharacter(charId));
    eventBus.subscribe('menuOpened', () => this.pauseForMenu = true);
    eventBus.subscribe('allMenusClosed', () => this.pauseForMenu = false);
    
    eventBus.subscribe('action_confirm_pressed', () => this._handleActionConfirm());
    eventBus.subscribe('action_restart_pressed', () => this._handleActionRestart());
    eventBus.subscribe('action_next_pressed', () => this._handleActionNext());
    eventBus.subscribe('action_previous_pressed', () => this._handleActionPrevious());
  }

  _handleActionConfirm() {
    if (this.gameState.showingLevelComplete) {
      const action = this.levelManager.hasNextLevel() ? 'next' : 'restart';
      this.menuManager.handleLevelCompleteAction(action);
    }
  }

  _handleActionRestart() {
    if (this.gameState.showingLevelComplete) {
      this.menuManager.handleLevelCompleteAction('restart');
    }
  }

  _handleActionNext() {
    if (this.gameState.showingLevelComplete && this.levelManager.hasNextLevel()) {
      this.menuManager.handleLevelCompleteAction('next');
    }
  }

  _handleActionPrevious() {
    if (this.gameState.showingLevelComplete && this.levelManager.hasPreviousLevel()) {
      this.menuManager.handleLevelCompleteAction('previous');
    }
  }

  setMenuManager(menuManager) {
      this.menuManager = menuManager;
      this.menuManager.setLevelManager(this.levelManager); 
  }

  updatePlayerCharacter(newCharId) {
    if (this.player) {
      this.player.characterId = newCharId || this.gameState.selectedCharacter;
    }
  }

  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.gameHasStarted = true;
    this.lastFrameTime = performance.now();
    eventBus.publish('gameStarted');
    eventBus.publish('gameResumed');
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
    this.soundManager.stopAll();
  }

  pause() {
      if (!this.isRunning) return;
      this.isRunning = false;
      // Pause gameplay sounds but leave UI sounds playing
      this.soundManager.stopAll({ except: ['UI'] });
      if (this.player) {
        this.player.needsRespawn = false;
      }
      eventBus.publish('gamePaused');
  }

  resume() {
    if (this.pauseForMenu) return;

    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      eventBus.publish('gameResumed');
      this.gameLoop();
    }

    if (this.player) {
      this.player.needsRespawn = false;
    }
  }

  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) {
      return;
    }

    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.016);
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.render(deltaTime);

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  loadLevel(sectionIndex, levelIndex) {
    const newLevel = this.levelManager.loadLevel(sectionIndex, levelIndex);
    if (!newLevel) {
      this.stop();
      return;
    }
    this.currentLevel = newLevel;
    this.pauseForMenu = false;
    this.gameState.showingLevelComplete = false;
    this.collectedFruits = [];
    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint.clear();
    
    this.soundManager.stopAll();

    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets,
      this.gameState.selectedCharacter
    );

    this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
    this.camera.snapToPlayer(this.player);

    this.levelStartTime = performance.now();
    
    if (this.gameHasStarted) {
        this.resume();
    } else {
        this.start();
    }
    eventBus.publish('levelLoaded', { gameState: this.gameState });
  }

  update(dt) {
    if (this.isRunning && !this.gameState.showingLevelComplete) {
      this.levelTime = (performance.now() - this.levelStartTime) / 1000;
    }

    const canProcessGameplayInput = this.isRunning && !this.pauseForMenu && !this.gameState.showingLevelComplete;

    const inputActions = {
      moveLeft: canProcessGameplayInput && (inputState.isKeyDown(this.keybinds.moveLeft)),
      moveRight: canProcessGameplayInput && (inputState.isKeyDown(this.keybinds.moveRight)),
      jump: canProcessGameplayInput && (inputState.isKeyDown(this.keybinds.jump)),
      dash: canProcessGameplayInput && (inputState.isKeyDown(this.keybinds.dash)),
    };

    this.player.handleInput(inputActions);
    this.player.update(dt);
    this.camera.update(this.player, dt);

    const context = {
        player: this.player,
        level: this.currentLevel,
        inputActions: inputActions,
        camera: this.camera,
        isRunning: this.isRunning
    };
    
    this.physicsSystem.update(dt, context);
    this.particleSystem.update(dt, context);
    this.uiSystem.update(dt, context);
    
    if (this.player.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) {
      this._respawnPlayer();
    }

    this.currentLevel.updateFruits(dt);
    this.currentLevel.updateTrophyAnimation(dt);
    this.currentLevel.updateCheckpoints(dt);
    this.currentLevel.updateTrampolines(dt);
    
    for (let i = this.collectedFruits.length - 1; i >= 0; i--) {
        const collected = this.collectedFruits[i];
        collected.frameTimer += dt;
        if (collected.frameTimer >= collected.frameSpeed) {
            collected.frameTimer = 0;
            collected.frame++;
            if (collected.frame >= collected.collectedFrameCount) {
                this.collectedFruits.splice(i, 1);
            }
        }
    }

    if (this.player.despawnAnimationFinished && !this.gameState.showingLevelComplete) {
      this.gameState.onLevelComplete();
      this.player.despawnAnimationFinished = false; 
      eventBus.publish('levelComplete', { deaths: this.player.deathCount, time: this.levelTime });
    }

    eventBus.publish('statsUpdated', {
      levelName: this.currentLevel.name,
      collectedFruits: this.currentLevel.getFruitCount(),
      totalFruits: this.currentLevel.getTotalFruitCount(),
      deathCount: this.player.deathCount,
      levelTime: this.levelTime,
      soundEnabled: this.soundManager.settings.enabled,
      soundVolume: this.soundManager.settings.volume
    });
  }

  _onPlayerDied() {
    if (!this.player.needsRespawn) {
      this.player.deathCount++;
      this.player.needsRespawn = true;
    }
  }

  _respawnPlayer() {
    const respawnPosition = this.lastCheckpoint || this.currentLevel.startPosition;
    
    if (this.lastCheckpoint) {
        this.currentLevel.fruits.forEach((fruit, index) => {
            fruit.collected = this.fruitsAtLastCheckpoint.has(index);
        });
    } else {
        this.currentLevel.fruits.forEach(f => f.collected = false);
    }
    this.currentLevel.recalculateCollectedFruits();
    this.player.respawn(respawnPosition);
    this.camera.shake(15, 0.5);
    eventBus.publish('playSound', { key: 'death_sound', volume: 0.3, channel: 'SFX' });
    this.player.needsRespawn = false;
  }

  _onFruitCollected(fruit) {
    this.currentLevel.collectFruit(fruit);
    eventBus.publish('playSound', { key: 'collect', volume: 0.8, channel: 'SFX' });

    this.collectedFruits.push({
      x: fruit.x, y: fruit.y, size: fruit.size, frame: 0,
      frameSpeed: 0.1, frameTimer: 0, collectedFrameCount: 6
    });
  }

  _onCheckpointActivated(cp) {
      cp.state = 'activating';
      this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 }; 
      eventBus.publish('playSound', { key: 'checkpoint_activated', volume: 1, channel: 'UI' });

      this.fruitsAtLastCheckpoint.clear();
      this.currentLevel.fruits.forEach((fruit, index) => {
          if (fruit.collected) this.fruitsAtLastCheckpoint.add(index);
      });

      this.currentLevel.checkpoints.forEach(otherCp => {
          if (otherCp !== cp && otherCp.state === 'active') {
              otherCp.state = 'inactive';
              otherCp.frame = 0;
          }
      });
  }

  _onTrophyCollision() {
    if (!this.player.isDespawning) {
      this.currentLevel.trophy.acquired = true;
      this.camera.shake(8, 0.3);
      this.player.startDespawn();
    }
  }
  
  render(dt) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 1. Draw scrolling background
      this.renderer.drawScrollingBackground(this.currentLevel, dt);

      // 2. Draw the main game world (player, level, etc.)
      this.renderer.renderScene(
        this.camera,
        this.currentLevel,
        this.player,
        this.collectedFruits
      );

      // 3. Render systems that draw on top of the world (e.g., particles)
      this.particleSystem.render(this.ctx, this.camera);
      
      // 4. Render UI overlays in screen space
      this.hud.drawGameHUD(this.ctx);
      this.uiSystem.render(this.ctx, this.isRunning);
  }
}