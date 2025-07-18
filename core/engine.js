import { Player } from '../entities/player.js';
import { levelSections } from '../entities/levels.js';
import { Level } from '../entities/platform.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';
import { HUD } from '../ui/hud.js';
import { GameState } from './game-state.js';
import { PhysicsSystem } from './physics-system.js';
import { Renderer } from './renderer.js';
import { eventBus } from './event-bus.js';

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    this.pauseForMenu = false;

    this.lastCheckpoint = null; 
    this.fruitsAtLastCheckpoint = new Set();

    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas);
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    this.physicsSystem = new PhysicsSystem();
    this.renderer = new Renderer(ctx, canvas, assets);

    this.levelStartTime = 0;
    this.levelTime = 0;

    this.gameState = new GameState(levelSections);
    
    this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex);
    this.camera.snapToPlayer(this.player);

    this.particles = [];
    this.menuManager = null; // Will be set by main.js
    this._setupEventSubscriptions();
  }
  
  _setupEventSubscriptions() {
    eventBus.subscribe('requestLevelLoad', ({ sectionIndex, levelIndex }) => this.loadLevel(sectionIndex, levelIndex));
    eventBus.subscribe('requestLevelRestart', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('requestResume', () => this.resume());
    eventBus.subscribe('requestPause', () => this.pause());
    eventBus.subscribe('keybindsUpdated', (newKeybinds) => this.updateKeybinds(newKeybinds));
    
    eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
    eventBus.subscribe('trophyCollision', () => this._onTrophyCollision());
    eventBus.subscribe('checkpointActivated', (cp) => this._onCheckpointActivated(cp));
    eventBus.subscribe('createParticles', ({x, y, type, direction}) => this.createDustParticles(x, y, type, direction));
    eventBus.subscribe('playerDied', () => this._onPlayerDied());
    eventBus.subscribe('characterUpdated', (charId) => this.updatePlayerCharacter(charId));
    eventBus.subscribe('menuOpened', () => this.pauseForMenu = true);
    eventBus.subscribe('allMenusClosed', () => this.pauseForMenu = false);

    // Subscriptions to handle decoupled input actions
    eventBus.subscribe('action_confirm_pressed', () => this._handleActionConfirm());
    eventBus.subscribe('action_restart_pressed', () => this._handleActionRestart());
    eventBus.subscribe('action_next_pressed', () => this._handleActionNext());
    eventBus.subscribe('action_previous_pressed', () => this._handleActionPrevious());
  }

  // Action handlers that check game state before acting
  _handleActionConfirm() {
    if (this.gameState.showingLevelComplete) {
      const action = this.gameState.hasNextLevel() ? 'next' : 'restart';
      this.menuManager.handleLevelCompleteAction(action);
    }
  }

  _handleActionRestart() {
    if (this.gameState.showingLevelComplete) {
      this.menuManager.handleLevelCompleteAction('restart');
    }
  }

  _handleActionNext() {
    if (this.gameState.showingLevelComplete && this.gameState.hasNextLevel()) {
      this.menuManager.handleLevelCompleteAction('next');
    }
  }

  _handleActionPrevious() {
    if (this.gameState.showingLevelComplete && this.gameState.hasPreviousLevel()) {
      this.menuManager.handleLevelCompleteAction('previous');
    }
  }

  setMenuManager(menuManager) {
      this.menuManager = menuManager;
  }

  updatePlayerCharacter(newCharId) {
    if (this.player) {
      this.player.characterId = newCharId || this.gameState.selectedCharacter;
      console.log(`Character skin changed to: ${this.player.characterId}`);
    }
  }

  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
    this.soundManager.stopAll();
  }

  pause() {
      if (!this.isRunning) return;
      this.isRunning = false;
      this.soundManager.stopAll();
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
      this.gameLoop();
    }

    if (this.player) {
      this.player.needsRespawn = false;
    }
    eventBus.publish('gameResumed');
  }

  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) {
      return;
    }

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

    const levelData = levelSections[sectionIndex].levels[levelIndex];
    if (!levelData) {
        console.error(`Failed to load level data for Section ${sectionIndex}, Level ${levelIndex}. The JSON file may be missing or failed to fetch. Cannot proceed.`);
        this.stop(); // Halt the game to prevent a crash.
        return;
    }

    this.pauseForMenu = false;

    this.gameState.showingLevelComplete = false;
    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;
    this.currentLevel = new Level(levelData);
    
    this.collectedFruits = [];
    this.particles = [];

    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint.clear();
    
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets,
      this.gameState.selectedCharacter
    );
    this.player.isSpawning = true;
    this.player.spawnComplete = false;
    this.player.deathCount = 0;

    this.camera.updateLevelBounds(this.currentLevel.width || 1280, this.currentLevel.height || 720);
    this.camera.snapToPlayer(this.player);

    this.levelStartTime = performance.now();
    this.resume();
    eventBus.publish('levelLoaded', { gameState: this.gameState });
  }

  update(dt) {
    try {
      if (this.isRunning && !this.gameState.showingLevelComplete) {
        this.levelTime = (performance.now() - this.levelStartTime) / 1000;
      }

      // Explicitly check if the game is in a state to process player input for gameplay actions.
      const canProcessGameplayInput = this.isRunning && !this.pauseForMenu && !this.gameState.showingLevelComplete;

      const inputActions = {
        moveLeft: canProcessGameplayInput && (this.keys[this.keybinds.moveLeft] || false),
        moveRight: canProcessGameplayInput && (this.keys[this.keybinds.moveRight] || false),
        jump: canProcessGameplayInput && (this.keys[this.keybinds.jump] || false),
        dash: canProcessGameplayInput && (this.keys[this.keybinds.dash] || false),
      };

      this.player.handleInput(inputActions);
      
      this.physicsSystem.update(
        this.player,
        this.currentLevel,
        dt,
        inputActions
      );

      this.player.update(dt);
      this.updateParticles(dt);
      
      this.camera.update(this.player, dt);

      if (this.player.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) {
        this._respawnPlayer();
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

    } catch (error) {
      console.error('Error in update loop:', error);
    }
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
    eventBus.publish('playSound', { key: 'death_sound', volume: 0.3 });
    this.player.needsRespawn = false;
  }

  _onFruitCollected(fruit) {
    this.currentLevel.collectFruit(fruit);
    eventBus.publish('playSound', { key: 'collect', volume: 0.8 });

    this.collectedFruits.push({
      x: fruit.x, y: fruit.y, size: fruit.size, frame: 0,
      frameSpeed: 0.1, frameTimer: 0, collectedFrameCount: 6
    });
  }

  _onCheckpointActivated(cp) {
      cp.state = 'activating';
      this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 }; 
      eventBus.publish('playSound', { key: 'checkpoint_activated', volume: 1 });

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
  
  createDustParticles(x, y, type, direction = 'right') {
    const count = type === 'dash' ? 10 : 7;
    const baseSpeed = type === 'dash' ? 150 : 100;

    for (let i = 0; i < count; i++) {
        const angle = (type === 'dash') 
            ? (direction === 'right' ? Math.PI : 0) + (Math.random() - 0.5) * (Math.PI / 2)
            : (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 3); 

        const speed = baseSpeed + Math.random() * 50;
        const particle = {
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.4 + Math.random() * 0.3, 
            initialLife: 0,
            size: 4 + Math.random() * 4,
            alpha: 1.0
        };
        particle.initialLife = particle.life; 
        this.particles.push(particle);
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;

        if (p.life <= 0) {
            this.particles.splice(i, 1);
        } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 50 * dt; 
            p.alpha = Math.max(0, p.life / p.initialLife); 
        }
    }
  }

  render() {
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.renderer.renderScene(
        this.camera,
        this.currentLevel,
        this.player,
        this.collectedFruits,
        this.particles
      );

      this.hud.drawGameHUD(this.ctx);

    } catch (error) {
      console.error('Error in render loop:', error);
      this.ctx.fillStyle = 'red';
      this.ctx.font = '20px sans-serif';
      this.ctx.fillText('Rendering Error - Check Console', 10, 30);
    }
  }
}