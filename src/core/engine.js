import { Camera } from './camera.js';
import { SoundManager } from '../managers/sound-manager.js';
import { HUD } from '../ui/hud.js';
import { GameState } from '../managers/game-state.js';
import { CollisionSystem } from '../systems/collision-system.js';
import { Renderer } from '../systems/renderer.js';
import { LevelManager } from '../managers/level-manager.js';
import { eventBus } from '../utils/event-bus.js';
import { ParticleSystem } from '../systems/particle-system.js';
import { UISystem } from '../ui/ui-system.js';
import { EntityManager } from './entity-manager.js';
import { createPlayer } from '../entities/entity-factory.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { InputSystem } from '../systems/input-system.js';
import { GameplaySystem } from '../systems/gameplay-system.js';
import { PlayerStateSystem } from '../systems/player-state-system.js';
import { MovementSystem } from '../systems/movement-system.js';
import { GameFlowSystem } from '../systems/game-flow-system.js';
import { EffectsSystem } from '../systems/effects-system.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { StateComponent } from '../components/StateComponent.js';

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds, fontRenderer) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    this.gameHasStarted = false;
    this.pauseForMenu = false;

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

    // Systems Initialization
    this.inputSystem = new InputSystem(this.entityManager);
    this.playerStateSystem = new PlayerStateSystem();
    this.movementSystem = new MovementSystem();
    this.collisionSystem = new CollisionSystem();
    this.gameplaySystem = new GameplaySystem();
    this.particleSystem = new ParticleSystem(assets);
    this.effectsSystem = new EffectsSystem(assets);
    this.gameFlowSystem = new GameFlowSystem();
    this.uiSystem = new UISystem(canvas, assets);

    this.systems = [
        this.inputSystem,
        this.playerStateSystem,
        this.movementSystem,
        this.collisionSystem,
        this.gameplaySystem,
        this.particleSystem,
        this.effectsSystem,
        this.gameFlowSystem,
        this.uiSystem,
    ];

    this.currentLevel = null;
    this._setupEventSubscriptions();
  }

  _setupEventSubscriptions() {
    eventBus.subscribe('requestStartGame', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('requestLevelLoad', ({ sectionIndex, levelIndex }) => this.loadLevel(sectionIndex, levelIndex));
    eventBus.subscribe('requestLevelRestart', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('keybindsUpdated', (newKeybinds) => this.updateKeybinds(newKeybinds));

    eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
    eventBus.subscribe('playerTookDamage', (data) => this._onPlayerTookDamage(data));
    eventBus.subscribe('checkpointActivated', (cp) => this._onCheckpointActivated(cp));
    eventBus.subscribe('playerDied', () => this._onPlayerDied());
    eventBus.subscribe('characterUpdated', (charId) => this.updatePlayerCharacter(charId));
    eventBus.subscribe('cameraShakeRequested', (params) => this._onCameraShakeRequested(params));

    eventBus.subscribe('menuOpened', () => { this.pauseForMenu = true; this.pause(); });
    eventBus.subscribe('allMenusClosed', () => { this.pauseForMenu = false; this.resume(); });
    eventBus.subscribe('pauseGame', () => this.pause());

    eventBus.subscribe('gameStateUpdated', (newState) => this.gameState = newState);
  }

  updateKeybinds(newKeybinds) { this.keybinds = { ...newKeybinds }; }

  start() { if (this.isRunning) return; this.isRunning = true; this.gameHasStarted = true; this.lastFrameTime = performance.now(); eventBus.publish('gameStarted'); eventBus.publish('gameResumed'); this.gameLoop(); }
  stop() { this.isRunning = false; this.soundManager.stopAll(); }

  pause() { if (!this.isRunning) return; this.isRunning = false; this.soundManager.stopAll({ except: ['UI'] }); const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent); if (playerCtrl) playerCtrl.needsRespawn = false; eventBus.publish('gamePaused'); }
  resume() { if (this.pauseForMenu || this.isRunning || !this.gameHasStarted || this.gameState.showingLevelComplete) return; this.isRunning = true; this.lastFrameTime = performance.now(); eventBus.publish('gameResumed'); this.gameLoop(); const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent); if (playerCtrl) playerCtrl.needsRespawn = false; }

  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) return;
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.016);
    this.lastFrameTime = currentTime;
    this.update(deltaTime);
    this.render(deltaTime);
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  loadLevel(sectionIndex, levelIndex) {
    this.levelManager.gameState = this.gameState;
    const newLevel = this.levelManager.loadLevel(sectionIndex, levelIndex);
    if (!newLevel) { this.stop(); return; }

    this.currentLevel = newLevel;
    this.pauseForMenu = false;

    let newState = new GameState(this.gameState);
    newState.showingLevelComplete = false;
    newState.currentSection = sectionIndex;
    newState.currentLevelIndex = levelIndex;
    
    // incrementAttempts returns the *new* modified state
    newState = newState.incrementAttempts(sectionIndex, levelIndex);
    
    this.gameState = newState;
    eventBus.publish('gameStateUpdated', this.gameState);

    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint.clear();
    this.soundManager.stopAll();
    this.entityManager = new EntityManager();
    this.inputSystem.entityManager = this.entityManager;
    this.effectsSystem.reset();
    this.gameFlowSystem.reset(this.isRunning);

    this.playerEntityId = createPlayer(this.entityManager, this.currentLevel.startPosition.x, this.currentLevel.startPosition.y, this.gameState.selectedCharacter);

    this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
    this.camera.snapToPlayer(this.entityManager, this.playerEntityId);
    this.renderer.preRenderLevel(this.currentLevel);

    if (this.gameHasStarted) this.resume(); else this.start();
    eventBus.publish('levelLoaded', { gameState: this.gameState });
  }

  update(dt) {
    if (!this.currentLevel) return;
    this.camera.update(this.entityManager, this.playerEntityId, dt);

    const context = {
        entityManager: this.entityManager,
        playerEntityId: this.playerEntityId,
        level: this.currentLevel,
        camera: this.camera,
        isRunning: this.isRunning,
        gameState: this.gameState,
        keybinds: this.keybinds,
        dt,
        levelManager: this.levelManager,
    };

    for (const system of this.systems) {
      system.update(dt, context);
    }

    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl && playerCtrl.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) this._respawnPlayer();

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

    const pos = this.entityManager.getComponent(this.playerEntityId, PositionComponent);
    const vel = this.entityManager.getComponent(this.playerEntityId, VelocityComponent);
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    const renderable = this.entityManager.getComponent(this.playerEntityId, RenderableComponent);
    const collision = this.entityManager.getComponent(this.playerEntityId, CollisionComponent);
    const state = this.entityManager.getComponent(this.playerEntityId, StateComponent);
    const health = this.entityManager.getComponent(this.playerEntityId, HealthComponent);

    pos.x = respawnPosition.x; pos.y = respawnPosition.y;
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

  render(dt) {
    if (!this.currentLevel) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderer.drawScrollingBackground(this.currentLevel, dt);
    this.renderer.renderScene(this.camera, this.currentLevel, this.entityManager);
    this.particleSystem.render(this.ctx, this.camera);
    this.effectsSystem.render(this.ctx, this.camera);
    this.hud.drawGameHUD(this.ctx);
    this.uiSystem.render(this.ctx, this.isRunning);
  }
}