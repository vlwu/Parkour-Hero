import { Camera } from './camera.js';
import { SoundManager } from '../managers/sound-manager.js';
import { HUD } from '../ui/hud.js';
import { GameState } from '../managers/game-state.js';
import { StorageManager } from '../managers/storage-manager.js';
import { CollisionSystem } from '../systems/collision-system.js';
import { Renderer } from '../systems/renderer.js';
import { LevelManager } from '../managers/level-manager.js';
import { eventBus } from '../utils/event-bus.js';
import { ParticleSystemWebGL } from '../systems/particle-system-webgl.js';
import { UISystem } from '../ui/ui-system.js';
import { EntityManager } from './entity-manager.js';
import { createPlayer } from '../entities/entity-factory.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PLAYER_CONSTANTS, EVENTS, PLAYER_STATES } from '../utils/constants.js';
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
import { BulletSystem } from '../systems/bullet-system.js';
import { TransitionSystem } from '../systems/transition-system.js';
import { coreSoundKeys, gameplaySoundKeys } from '../managers/asset-manager.js';
import { EnemyComponent } from '../components/EnemyComponent.js';

const FIXED_DT = 1 / 60;

export class Engine {
  constructor(gl, uiCanvas, ctx, assets, initialKeybinds, fontRenderer, assetManager) {
    this.gl = gl;
    this.canvas = gl.canvas;
    this.uiCanvas = uiCanvas;
    this.ctx = ctx;
    this.assets = assets;
    this.assetManager = assetManager;
    this.lastFrameTime = 0;
    this.accumulator = 0;
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    this.gameHasStarted = false;
    this.pauseForMenu = false;
    this.timeScale = 1.0;
    this.isTransitioning = false;

    this.entityManager = new EntityManager();
    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint = new Set();
    this.playerEntityId = null;

    this.camera = new Camera(this.canvas.width, this.canvas.height);
    this.hud = new HUD(this.ctx, fontRenderer);
    this.soundManager = new SoundManager();
    this.soundManager.addSounds(assets, coreSoundKeys);
    this.renderer = new Renderer(this.gl, this.canvas, this.assets);
    this.gameState = new GameState();

    this.levelManager = new LevelManager(this.gameState);

    this.inputSystem = new InputSystem(this.entityManager);
    this.playerStateSystem = new PlayerStateSystem();
    this.movementSystem = new MovementSystem();
    this.collisionSystem = new CollisionSystem();
    this.gameplaySystem = new GameplaySystem();
    this.particleSystem = new ParticleSystemWebGL(this.gl, this.assets);
    this.effectsSystem = new EffectsSystem(this.assets, fontRenderer);
    this.gameFlowSystem = new GameFlowSystem();
    this.uiSystem = new UISystem(this.uiCanvas, this.assets);
    this.enemySystem = new EnemySystem(this.collisionSystem);
    this.bulletSystem = new BulletSystem(this.collisionSystem);
    this.transitionSystem = new TransitionSystem(this.uiCanvas, this.assets);

    this.systems = [
        this.inputSystem,
        this.playerStateSystem,
        this.movementSystem,
        this.collisionSystem,
        this.enemySystem,
        this.bulletSystem,
        this.gameplaySystem,
        this.renderer,
        this.particleSystem,
        this.effectsSystem,
        this.gameFlowSystem,
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

    subscribeAndTrack(EVENTS.REQUEST_START_GAME, () => this.initiateLevelLoad(this.gameState.currentSection, this.gameState.currentLevelIndex));
    subscribeAndTrack(EVENTS.REQUEST_LEVEL_LOAD, ({ sectionIndex, levelIndex }) => this.initiateLevelLoad(sectionIndex, levelIndex));
    subscribeAndTrack(EVENTS.REQUEST_LEVEL_RESTART, () => this.initiateLevelLoad(this.gameState.currentSection, this.gameState.currentLevelIndex));
    subscribeAndTrack(EVENTS.KEYBINDS_UPDATED, this.updateKeybinds);
    subscribeAndTrack(EVENTS.FRUIT_COLLECTED, this._onFruitCollected);
    subscribeAndTrack(EVENTS.PLAYER_TOOK_DAMAGE, this._onPlayerTookDamage);
    subscribeAndTrack(EVENTS.CHECKPOINT_ACTIVATED, this._onCheckpointActivated);
    subscribeAndTrack(EVENTS.PLAYER_DIED, this._onPlayerDied);
    subscribeAndTrack(EVENTS.CHARACTER_UPDATED, this.updatePlayerCharacter);
    subscribeAndTrack(EVENTS.CAMERA_SHAKE_REQUESTED, this._onCameraShakeRequested);
    subscribeAndTrack(EVENTS.MENU_OPENED, () => { this.pauseForMenu = true; this.pause(); });
    subscribeAndTrack(EVENTS.ALL_MENUS_CLOSED, () => { this.pauseForMenu = false; this.resume(); });
    subscribeAndTrack(EVENTS.GAME_PAUSED, this.pause);
    subscribeAndTrack(EVENTS.GAME_STATE_UPDATED, (newState) => this.gameState = newState);
  }

  updateKeybinds(newKeybinds) { this.keybinds = { ...newKeybinds }; }

  start() { if (this.isRunning) return; this.isRunning = true; this.lastFrameTime = performance.now(); eventBus.publish(EVENTS.GAME_RESUMED); this.gameLoop(); }
  stop() { this.isRunning = false; this.soundManager.stopAll(); }

  pause() {
    if (this.timeScale === 0.0) return;
    this.timeScale = 0.0;
    this.soundManager.stopAll({ except: ['UI'] });
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl) playerCtrl.needsRespawn = false;
    eventBus.publish(EVENTS.GAME_PAUSED);
  }

  resume() {
    if (this.pauseForMenu || !this.gameHasStarted || this.gameState.showingLevelComplete || this.isTransitioning) return;
    if (this.timeScale === 1.0) return;
    this.timeScale = 1.0;
    eventBus.publish(EVENTS.GAME_RESUMED);
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

    this.transitionSystem.update(deltaTime);

    this.accumulator += deltaTime;

    while (this.accumulator >= FIXED_DT) {
        const effectiveDeltaTime = FIXED_DT * this.timeScale;
        this.update(effectiveDeltaTime);
        this.accumulator -= FIXED_DT;
    }

    const alpha = this.accumulator / FIXED_DT;
    this.render(alpha);

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  _resetForNewLevel() {
      this.pauseForMenu = false;

      const currentState = this.gameState;
      const newStateData = JSON.parse(JSON.stringify(currentState));
      newStateData.showingLevelComplete = false;
      this.gameState = new GameState(newStateData);
      eventBus.publish(EVENTS.GAME_STATE_UPDATED, this.gameState);

      this.lastCheckpoint = null;
      this.fruitsAtLastCheckpoint.clear();
      this.soundManager.stopAll();
      this.entityManager = new EntityManager();
      this.inputSystem.entityManager = this.entityManager;
      this.effectsSystem.reset();
      this.particleSystem.reset();
      this.gameFlowSystem.reset(this.isRunning);
  }

  initiateLevelLoad(sectionIndex, levelIndex) {
    if (this.isTransitioning) return;

    if (!this.isRunning) {
        this.start();
    }

    this.isTransitioning = true;
    this.pause();

    this.uiCanvas.style.zIndex = '1000';

    this.transitionSystem.start(
        async () => {
            await this.loadLevel(sectionIndex, levelIndex);
        },
        () => {
            this.isTransitioning = false;
            this.resume();
            this.uiCanvas.style.zIndex = '100';
        }
    );
  }

  async loadLevel(sectionIndex, levelIndex) {
    const levelData = await this.levelManager.getLevelData(sectionIndex, levelIndex);
    if (!levelData) { this.stop(); return; }

    this._resetForNewLevel();

    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;

    const newGameState = this.gameState.incrementAttempts(sectionIndex, levelIndex);
    if (newGameState !== this.gameState) {
        this.gameState = newGameState;
        StorageManager.saveProgress(this.gameState);
        eventBus.publish(EVENTS.GAME_STATE_UPDATED, this.gameState);
    }

    this.currentLevel = new Level(levelData, this.entityManager);
    this.playerEntityId = createPlayer(this.entityManager, this.currentLevel.startPosition.x, this.currentLevel.startPosition.y, this.gameState.selectedCharacter);

    this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
    this.camera.snapToPlayer(this.entityManager, this.playerEntityId);
    this.renderer.preRenderLevel(this.currentLevel);

    if (!this.gameHasStarted) {
      this.gameHasStarted = true;
      eventBus.publish(EVENTS.GAME_STARTED);
    }

    eventBus.publish(EVENTS.LEVEL_LOADED, { gameState: this.gameState });
  }

  loadLevelFromData(levelData) {
      if (!levelData) {
          console.error("No level data provided to loadLevelFromData");
          this.stop();
          return;
      }

      this._resetForNewLevel();

      this.currentLevel = new Level(levelData, this.entityManager);
      this.playerEntityId = createPlayer(this.entityManager, this.currentLevel.startPosition.x, this.currentLevel.startPosition.y, this.gameState.selectedCharacter);

      this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
      this.camera.snapToPlayer(this.entityManager, this.playerEntityId);
      this.renderer.preRenderLevel(this.currentLevel);

      this.timeScale = 1.0;
      if (!this.gameHasStarted) {
          this.start();
      }
      eventBus.publish(EVENTS.GAME_RESUMED);
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
    this.currentLevel.update(dt, this.entityManager, this.playerEntityId, eventBus, this.camera);

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
        if (system instanceof TransitionSystem) continue;
        system.update(dt, context);
    }

    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl && playerCtrl.needsRespawn && !this.gameState.showingLevelComplete && this.timeScale > 0) {
      this._respawnPlayer();
    }

    const playerHealth = this.entityManager.getComponent(this.playerEntityId, HealthComponent);
    eventBus.publish(EVENTS.STATS_UPDATED, {
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
          const pos = this.entityManager.getComponent(this.playerEntityId, PositionComponent);
          const col = this.entityManager.getComponent(this.playerEntityId, CollisionComponent);
          if (pos && col) {
              eventBus.publish(EVENTS.CREATE_DAMAGE_INDICATOR, {
                  amount,
                  x: pos.x + col.width / 2,
                  y: pos.y
              });
          }
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
        state.currentState = PLAYER_STATES.HIT;
        renderable.animationState = PLAYER_STATES.HIT;
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
        eventBus.publish(EVENTS.PLAY_SOUND, { key: 'death_sound', volume: 0.3, channel: 'SFX' });

        const enemyEntities = this.entityManager.query([EnemyComponent, StateComponent]);
        for (const enemyId of enemyEntities) {
            const enemy = this.entityManager.getComponent(enemyId, EnemyComponent);
            if (enemy.type === 'rhino') {
                const enemyState = this.entityManager.getComponent(enemyId, StateComponent);
                if (enemyState.currentState === 'charging') {
                    eventBus.publish(EVENTS.STOP_SOUND_LOOP, { key: 'rhino_charge' });
                    break;
                }
            }
        }
    }
  }

  _respawnPlayer() {
    const respawnPosition = this.lastCheckpoint || this.currentLevel.startPosition;
    if (this.lastCheckpoint) this.currentLevel.fruits.forEach((fruit, index) => fruit.collected = this.fruitsAtLastCheckpoint.has(index));
    else this.currentLevel.fruits.forEach(f => f.collected = false);
    this.currentLevel.recalculateCollectedFruits();
    this.effectsSystem.reset();
    this.particleSystem.reset();

    if (this.currentLevel.trophy) {
        this.currentLevel.trophy.acquired = false;
        this.currentLevel.trophy.isAnimating = false;
        this.currentLevel.trophy.animationFrame = 0;
        this.currentLevel.trophy.animationTimer = 0;
        this.currentLevel.trophy.inactive = !this.currentLevel.allFruitsCollected();
    }

    this.currentLevel.resetEnemies(this.entityManager, this.collisionSystem);

    const pos = this.entityManager.getComponent(this.playerEntityId, PositionComponent);
    const vel = this.entityManager.getComponent(this.playerEntityId, VelocityComponent);
    const oldPlayerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
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

    const currentDeathCount = oldPlayerCtrl.deathCount;
    const currentSound = oldPlayerCtrl.activeSurfaceSound;

    this.entityManager.addComponent(this.playerEntityId, new PlayerControlledComponent());
    const newPlayerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    newPlayerCtrl.deathCount = currentDeathCount;
    newPlayerCtrl.activeSurfaceSound = currentSound;
    newPlayerCtrl.needsRespawn = false;

    state.currentState = PLAYER_STATES.SPAWN;
    renderable.animationState = PLAYER_STATES.SPAWN;
    renderable.animationFrame = 0;
    renderable.animationTimer = 0;
    renderable.direction = 'right';
    renderable.width = PLAYER_CONSTANTS.SPAWN_WIDTH;
    renderable.height = PLAYER_CONSTANTS.SPAWN_HEIGHT;
    collision.isGrounded = false;
    collision.isAgainstWall = false;
    collision.groundType = null;

    this.camera.shake(15, 0.5);
    eventBus.publish(EVENTS.PLAYER_RESPAWNED);
  }

  _onFruitCollected(fruit) {
    this.currentLevel.collectFruit(fruit);
    eventBus.publish(EVENTS.PLAY_SOUND, { key: 'collect', volume: 0.8, channel: 'SFX' });
    const health = this.entityManager.getComponent(this.playerEntityId, HealthComponent);
    if (health && health.currentHealth < health.maxHealth) {
        health.currentHealth = Math.min(health.maxHealth, health.currentHealth + 10);
    }
  }

  updatePlayerCharacter(newCharId) {
      if (this.playerEntityId === null) return;
      const charComp = this.entityManager.getComponent(this.playerEntityId, CharacterComponent);
      if (charComp) {
          const newId = newCharId || this.gameState.selectedCharacter;
          if (charComp.characterId !== newId) {
              charComp.characterId = newId;
              const newGameState = this.gameState.setSelectedCharacter(newId);
              if (newGameState !== this.gameState) {
                  this.gameState = newGameState;
                  StorageManager.saveProgress(this.gameState);
                  eventBus.publish(EVENTS.GAME_STATE_UPDATED, this.gameState);
              }
          }
      }
  }

  _onCheckpointActivated(cp) {
      cp.state = 'activating';
      this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 };
      eventBus.publish(EVENTS.PLAY_SOUND, { key: 'checkpoint_activated', volume: 1, channel: 'UI' });
      this.fruitsAtLastCheckpoint.clear();
      this.currentLevel.fruits.forEach((fruit, index) => { if (fruit.collected) this.fruitsAtLastCheckpoint.add(index); });
      this.currentLevel.checkpoints.forEach(otherCp => { if (otherCp !== cp && otherCp.state === 'active') { otherCp.state = 'inactive'; otherCp.frame = 0; } });
  }

  _onCameraShakeRequested({ intensity, duration }) {
      if (this.camera) this.camera.shake(intensity, duration);
  }

  render(alpha) {
    if (!this.currentLevel) return;

    this.renderer.renderScene(this.camera, this.currentLevel, this.entityManager, alpha);
    this.particleSystem.render(this.camera, alpha);

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.effectsSystem.render(this.ctx, this.camera, alpha);
    this.hud.drawGameHUD(this.ctx, this.camera, this.currentLevel, FIXED_DT, this.entityManager, this.playerEntityId);
    this.uiSystem.render(this.ctx, this.timeScale > 0);
    this.transitionSystem.render(this.ctx);
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