import { Camera } from './camera.js';
import { SoundManager } from '../managers/sound-manager.js';
import { HUD } from '../ui/hud.js';
import { GameState } from '../managers/game-state.js';
import { CollisionSystem } from '../systems/collision-system.js';
import { Renderer } from '../systems/renderer.js';
import { LevelManager } from '../managers/level-manager.js';
import { eventBus } from '../utils/event-bus.js';
import { ParticleSystemWebGL } from '../systems/particle-system-webgl.js'; // The only particle system now
import { UISystem } from '../ui/ui-system.js';
import { EntityManager } from './entity-manager.js';
import { createPlayer } from '../entities/entity-factory.js';
import { createEnemy } from '../entities/enemy-factory.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { InputSystem } from '../systems/input-system.js';
import { GameplaySystem } from '../systems/gameplay-system.js';
import { PlayerStateSystem } from '../systems/player-state-system.js';
import { MovementSystem } from '../systems/movement-system.js';
import { GameFlowSystem } from '../systems/game-flow-system.js';
import { EffectsSystem } from '../systems/effects-system.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { PreviousPositionComponent } from '../components/PreviousPositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { EnemySystem } from '../systems/enemy-system.js';
import { Level } from '../entities/level.js';

const FIXED_DT = 1 / 60;

export class Engine {
  constructor(ctx, gl, canvas, assets, initialKeybinds, fontRenderer) {
    this.ctx = ctx;
    this.gl = gl;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.accumulator = 0;
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    this.gameHasStarted = false;
    this.pauseForMenu = false;
    this.timeScale = 1.0;

    this.entityManager = new EntityManager();
    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint = new Set();
    this.playerEntityId = null;

    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas, fontRenderer);
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    this.renderer = new Renderer(ctx, canvas, assets);
    this.gameState = new GameState();
    eventBus.publish('gameStateUpdated', this.gameState);

    this.levelManager = new LevelManager(this.gameState);

    this.inputSystem = new InputSystem(this.entityManager);
    this.playerStateSystem = new PlayerStateSystem();
    this.movementSystem = new MovementSystem();
    this.collisionSystem = new CollisionSystem();
    this.gameplaySystem = new GameplaySystem();
    this.particleSystem = new ParticleSystemWebGL(gl, assets); // Use the WebGL system
    this.effectsSystem = new EffectsSystem(assets);
    this.gameFlowSystem = new GameFlowSystem();
    this.uiSystem = new UISystem(canvas, assets);
    this.enemySystem = new EnemySystem();

    this.systems = [
        this.inputSystem,
        this.playerStateSystem,
        this.movementSystem,
        this.collisionSystem,
        this.enemySystem,
        this.gameplaySystem,
        this.particleSystem, // It is now the WebGL one
        this.effectsSystem,
        this.gameFlowSystem,
        this.uiSystem,
    ];

    this.subscriptions = [];
    this.currentLevel = null;
    this._setupEventSubscriptions();
  }

  _setupEventSubscriptions() {
    const subscribeAndTrack = (eventName, callback) => {
        const boundCallback = callback.bind(this);
        this.subscriptions.push({ eventName, callback: boundCallback });
        eventBus.subscribe(eventName, boundCallback);
    };

    subscribeAndTrack('requestStartGame', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    subscribeAndTrack('requestLevelLoad', ({ sectionIndex, levelIndex }) => this.loadLevel(sectionIndex, levelIndex));
    subscribeAndTrack('requestLevelRestart', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    subscribeAndTrack('keybindsUpdated', this.updateKeybinds);
    subscribeAndTrack('fruitCollected', this._onFruitCollected);
    subscribeAndTrack('playerTookDamage', this._onPlayerTookDamage);
    subscribeAndTrack('checkpointActivated', this._onCheckpointActivated);
    subscribeAndTrack('playerDied', this._onPlayerDied);
    subscribeAndTrack('characterUpdated', this.updatePlayerCharacter);
    subscribeAndTrack('cameraShakeRequested', this._onCameraShakeRequested);
    subscribeAndTrack('menuOpened', () => { this.pauseForMenu = true; this.pause(); });
    subscribeAndTrack('allMenusClosed', () => { this.pauseForMenu = false; this.resume(); });
    subscribeAndTrack('pauseGame', this.pause);
    subscribeAndTrack('gameStateUpdated', (newState) => this.gameState = newState);
  }

  updateKeybinds(newKeybinds) { this.keybinds = { ...newKeybinds }; }

  start() { if (this.isRunning) return; this.isRunning = true; this.gameHasStarted = true; this.lastFrameTime = performance.now(); eventBus.publish('gameStarted'); eventBus.publish('gameResumed'); this.gameLoop(); }
  stop() { this.isRunning = false; this.soundManager.stopAll(); }

  pause() {
    if (this.timeScale === 0.0) return;
    this.timeScale = 0.0;
    this.soundManager.stopAll({ except: ['UI'] });
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl) playerCtrl.needsRespawn = false;
    eventBus.publish('gamePaused');
  }

  resume() {
    if (this.pauseForMenu || !this.gameHasStarted || this.gameState.showingLevelComplete) return;
    if (this.timeScale === 1.0) return;
    this.timeScale = 1.0;
    eventBus.publish('gameResumed');
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl) playerCtrl.needsRespawn = false;
  }

  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) return;

    let deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    if (deltaTime > 0.25) {
        deltaTime = 0.25;
    }

    this.accumulator += deltaTime;

    while (this.accumulator >= FIXED_DT) {
        const effectiveDeltaTime = FIXED_DT * this.timeScale;
        this.update(effectiveDeltaTime);
        this.accumulator -= FIXED_DT;
    }

    const alpha = this.accumulator / FIXED_DT;
    this.render(deltaTime, alpha);

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  loadLevel(sectionIndex, levelIndex) {
    const levelData = this.levelManager.getLevelData(sectionIndex, levelIndex);
    if (!levelData) { this.stop(); return; }

    this.pauseForMenu = false;

    let newState = new GameState(this.gameState);
    newState.showingLevelComplete = false;
    newState.currentSection = sectionIndex;
    newState.currentLevelIndex = levelIndex;

    newState = newState.incrementAttempts(sectionIndex, levelIndex);

    this.gameState = newState;
    eventBus.publish('gameStateUpdated', this.gameState);

    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint.clear();
    this.soundManager.stopAll();
    this.entityManager = new EntityManager();
    this.inputSystem.entityManager = this.entityManager;
    this.effectsSystem.reset();
    this.particleSystem.reset();
    this.gameFlowSystem.reset(this.isRunning);

    this.currentLevel = new Level(levelData, this.entityManager);
    this.playerEntityId = createPlayer(this.entityManager, this.currentLevel.startPosition.x, this.currentLevel.startPosition.y, this.gameState.selectedCharacter);

    this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
    this.camera.snapToPlayer(this.entityManager, this.playerEntityId);
    this.renderer.preRenderLevel(this.currentLevel);

    this.timeScale = 1.0;
    if (!this.gameHasStarted) {
      this.start();
    }

    eventBus.publish('levelLoaded', { gameState: this.gameState });
  }

  loadLevelFromData(levelData) {
      if (!levelData) {
          console.error("No level data provided to loadLevelFromData");
          this.stop();
          return;
      }
      this.pauseForMenu = false;
      this.gameState.showingLevelComplete = false;
      eventBus.publish('gameStateUpdated', this.gameState);
      this.lastCheckpoint = null;
      this.fruitsAtLastCheckpoint.clear();
      this.soundManager.stopAll();
      this.entityManager = new EntityManager();
      this.inputSystem.entityManager = this.entityManager;
      this.effectsSystem.reset();
      this.particleSystem.reset();
      this.gameFlowSystem.reset(this.isRunning);
      this.currentLevel = new Level(levelData, this.entityManager);
      this.playerEntityId = createPlayer(this.entityManager, this.currentLevel.startPosition.x, this.currentLevel.startPosition.y, this.gameState.selectedCharacter);
      this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
      this.camera.snapToPlayer(this.entityManager, this.playerEntityId);
      this.renderer.preRenderLevel(this.currentLevel);
      this.timeScale = 1.0;
      if (!this.gameHasStarted) {
          this.start();
      }
      eventBus.publish('gameResumed');
  }

  update(dt) {
    if (!this.currentLevel) return;

    const entitiesToInterpolate = this.entityManager.query([PositionComponent]);
    for (const entityId of entitiesToInterpolate) {
        const pos = this.entityManager.getComponent(entityId, PositionComponent);
        let prevPos = this.entityManager.getComponent(entityId, PreviousPositionComponent);
        if (prevPos) {
            prevPos.x = pos.x;
            prevPos.y = pos.y;
        } else {
            this.entityManager.addComponent(entityId, new PreviousPositionComponent(pos.x, pos.y));
        }
    }

    this.camera.update(this.entityManager, this.playerEntityId, dt);

    const context = {
        entityManager: this.entityManager,
        playerEntityId: this.playerEntityId,
        playerCol: this.playerEntityId ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null,
        level: this.currentLevel,
        camera: this.camera,
        isRunning: this.isRunning && this.timeScale > 0,
        gameState: this.gameState,
        keybinds: this.keybinds,
        dt,
        levelManager: this.levelManager,
    };

    for (const system of this.systems) {
      system.update(dt, context);
    }

    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl && playerCtrl.needsRespawn && !this.gameState.showingLevelComplete && this.timeScale > 0) {
      this._respawnPlayer();
    }

    this.currentLevel.update(dt, this.entityManager, this.playerEntityId, eventBus, this.camera);

    const playerHealth = this.entityManager.getComponent(this.playerEntityId, HealthComponent);
    eventBus.publish('statsUpdated', {
      levelName: this.currentLevel.name,
      collectedFruits: this.currentLevel.getFruitCount(),
      totalFruits: this.currentLevel.getTotalFruitCount(),
      deathCount: playerCtrl ? playerCtrl.deathCount : 0,
      levelTime: this.gameFlowSystem.levelTime,
      health: playerHealth ? playerHealth.currentHealth : 100,
      maxHealth: playerHealth ? playerHealth.maxHealth : 100,
    });
  }

  _onPlayerTookDamage({ amount }) {
      const health = this.entityManager.getComponent(this.playerEntityId, HealthComponent);
      const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
      if (health && playerCtrl && !playerCtrl.isHit && !playerCtrl.needsRespawn) {
          health.currentHealth = Math.max(0, health.currentHealth - amount);
          this.camera.shake(8, 0.3);
          if (health.currentHealth <= 0) this._onPlayerDied();
      }
  }

  _onPlayerDied() {
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl && !playerCtrl.needsRespawn) {
        const vel = this.entityManager.getComponent(this.playerEntityId, VelocityComponent);
        const state = this.entityManager.getComponent(this.playerEntityId, StateComponent);
        const renderable = this.entityManager.getComponent(this.playerEntityId, RenderableComponent);
        playerCtrl.needsRespawn = true;
        playerCtrl.deathCount++;
        vel.vx = 0; vel.vy = 0;
        playerCtrl.isHit = true;
        state.currentState = 'hit';
        renderable.animationState = 'hit';
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
        eventBus.publish('playSound', { key: 'death_sound', volume: 0.3, channel: 'SFX' });
    }
  }

  _respawnPlayer() {
    const respawnPosition = this.lastCheckpoint || this.currentLevel.startPosition;
    if (this.lastCheckpoint) this.currentLevel.fruits.forEach((fruit, index) => fruit.collected = this.fruitsAtLastCheckpoint.has(index));
    else this.currentLevel.fruits.forEach(f => f.collected = false);
    this.currentLevel.recalculateCollectedFruits();
    this.effectsSystem.reset();

    if (this.currentLevel.trophy) {
        this.currentLevel.trophy.acquired = false;
        this.currentLevel.trophy.isAnimating = false;
        this.currentLevel.trophy.animationFrame = 0;
        this.currentLevel.trophy.animationTimer = 0;
        this.currentLevel.trophy.inactive = !this.currentLevel.allFruitsCollected();
    }

    this.currentLevel.resetEnemies(this.entityManager);

    const pos = this.entityManager.getComponent(this.playerEntityId, PositionComponent);
    const vel = this.entityManager.getComponent(this.playerEntityId, VelocityComponent);
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    const renderable = this.entityManager.getComponent(this.playerEntityId, RenderableComponent);
    const collision = this.entityManager.getComponent(this.playerEntityId, CollisionComponent);
    const state = this.entityManager.getComponent(this.playerEntityId, StateComponent);
    const health = this.entityManager.getComponent(this.playerEntityId, HealthComponent);
    const prevPos = this.entityManager.getComponent(this.playerEntityId, PreviousPositionComponent);

    pos.x = respawnPosition.x; pos.y = respawnPosition.y;
    if (prevPos) {
        prevPos.x = respawnPosition.x;
        prevPos.y = respawnPosition.y;
    }
    vel.vx = 0; vel.vy = 0;
    if (health) health.currentHealth = health.maxHealth;

    const currentDeathCount = playerCtrl.deathCount;
    const currentSound = playerCtrl.activeSurfaceSound;
    Object.assign(playerCtrl, new PlayerControlledComponent());
    playerCtrl.deathCount = currentDeathCount;
    playerCtrl.activeSurfaceSound = currentSound;
    playerCtrl.needsRespawn = false;

    state.currentState = 'spawn';
    renderable.animationState = 'spawn';
    renderable.animationFrame = 0;
    renderable.animationTimer = 0;
    renderable.direction = 'right';
    renderable.width = PLAYER_CONSTANTS.SPAWN_WIDTH;
    renderable.height = PLAYER_CONSTANTS.SPAWN_HEIGHT;
    collision.isGrounded = false;
    collision.isAgainstWall = false;
    collision.groundType = null;

    this.camera.shake(15, 0.5);
    eventBus.publish('playerRespawned');
  }

  _onFruitCollected(fruit) {
    this.currentLevel.collectFruit(fruit);
    eventBus.publish('playSound', { key: 'collect', volume: 0.8, channel: 'SFX' });
    const health = this.entityManager.getComponent(this.playerEntityId, HealthComponent);
    if (health && health.currentHealth < health.maxHealth) {
        health.currentHealth = Math.min(health.maxHealth, health.currentHealth + 10);
    }
  }

  updatePlayerCharacter(newCharId) {
      if (this.playerEntityId === null) return;
      const charComp = this.entityManager.getComponent(this.playerEntityId, CharacterComponent);
      if (charComp) charComp.characterId = newCharId || this.gameState.selectedCharacter;
  }

  _onCheckpointActivated(cp) {
      cp.state = 'activating';
      this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 };
      eventBus.publish('playSound', { key: 'checkpoint_activated', volume: 1, channel: 'UI' });
      this.fruitsAtLastCheckpoint.clear();
      this.currentLevel.fruits.forEach((fruit, index) => { if (fruit.collected) this.fruitsAtLastCheckpoint.add(index); });
      this.currentLevel.checkpoints.forEach(otherCp => { if (otherCp !== cp && otherCp.state === 'active') { otherCp.state = 'inactive'; otherCp.frame = 0; } });
  }

  _onCameraShakeRequested({ intensity, duration }) {
      if (this.camera) this.camera.shake(intensity, duration);
  }

  render(deltaTime, alpha) {
    if (!this.currentLevel) return;

    // Clear the 2D canvas for its own elements.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clear the WebGL canvas to be fully transparent.
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Render all 2D elements first.
    this.renderer.drawScrollingBackground(this.currentLevel, deltaTime * this.timeScale);
    this.renderer.renderScene(this.camera, this.currentLevel, this.entityManager, alpha);
    this.effectsSystem.render(this.ctx, this.camera);
    
    // Render the WebGL particles on top of the 2D scene.
    this.particleSystem.render(this.camera);
    
    // Render the 2D HUD and UI on top of everything.
    // Pass FIXED_DT to HUD for correct FPS calculation
    this.hud.drawGameHUD(this.ctx, FIXED_DT);
    
    this.uiSystem.render(this.ctx, this.timeScale > 0);
  }

  destroy() {
      this.stop();
      this.subscriptions.forEach(({ eventName, callback }) => {
          eventBus.unsubscribe(eventName, callback);
      });
      this.subscriptions = [];
      this.inputSystem.destroy();
      this.uiSystem.destroy();
      this.soundManager.destroy();
      console.log("Engine destroyed and listeners cleaned up.");
  }
}