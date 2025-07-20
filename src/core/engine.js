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
import { EntityManager } from './entity-manager.js';
import { createPlayer } from '../entities/entity-factory.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

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

    this.entityManager = new EntityManager();
    this.lastCheckpoint = null; 
    this.fruitsAtLastCheckpoint = new Set();
    this.playerEntityId = null;

    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas, this.fontRenderer);
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    this.renderer = new Renderer(ctx, canvas, assets);
    this.gameState = new GameState();
    this.levelManager = new LevelManager(this.gameState); 

    this.physicsSystem = new PhysicsSystem();
    this.particleSystem = new ParticleSystem(assets);
    this.uiSystem = new UISystem(canvas, assets);
    this.systems = [this.physicsSystem, this.particleSystem, this.uiSystem];

    this.levelStartTime = 0;
    this.levelTime = 0;
    this.currentLevel = null;
    this.collectedFruits = [];
    
    this._setupEventSubscriptions();
  }
  
  _setupEventSubscriptions() {
    eventBus.subscribe('requestStartGame', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('requestLevelLoad', ({ sectionIndex, levelIndex }) => this.loadLevel(sectionIndex, levelIndex));
    eventBus.subscribe('requestLevelRestart', () => this.loadLevel(this.gameState.currentSection, this.gameState.currentLevelIndex));
    eventBus.subscribe('keybindsUpdated', (newKeybinds) => this.updateKeybinds(newKeybinds));
    
    eventBus.subscribe('fruitCollected', (fruit) => this._onFruitCollected(fruit));
    eventBus.subscribe('trophyCollision', () => this._onTrophyCollision());
    eventBus.subscribe('checkpointActivated', (cp) => this._onCheckpointActivated(cp));
    eventBus.subscribe('playerDied', () => this._onPlayerDied());
    eventBus.subscribe('characterUpdated', (charId) => this.updatePlayerCharacter(charId));
    
    // Simplified pause logic
    eventBus.subscribe('menuOpened', () => {
        this.pauseForMenu = true;
        this.pause();
    });
    eventBus.subscribe('allMenusClosed', () => {
        this.pauseForMenu = false;
        this.resume();
    });
  }

  updatePlayerCharacter(newCharId) {
    if (this.playerEntityId === null) return;
    const charComp = this.entityManager.getComponent(this.playerEntityId, CharacterComponent);
    if (charComp) charComp.characterId = newCharId || this.gameState.selectedCharacter;
  }

  updateKeybinds(newKeybinds) { this.keybinds = { ...newKeybinds }; }
  
  start() { if (this.isRunning) return; this.isRunning = true; this.gameHasStarted = true; this.lastFrameTime = performance.now(); eventBus.publish('gameStarted'); eventBus.publish('gameResumed'); this.gameLoop(); }
  stop() { this.isRunning = false; this.soundManager.stopAll(); }

  pause() {
      if (!this.isRunning) return;
      this.isRunning = false;
      this.soundManager.stopAll({ except: ['UI'] });
      const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
      if (playerCtrl) playerCtrl.needsRespawn = false;
      eventBus.publish('gamePaused');
  }

  resume() {
    if (this.pauseForMenu || this.isRunning || !this.gameHasStarted || this.gameState.showingLevelComplete) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    eventBus.publish('gameResumed');
    this.gameLoop();
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl) playerCtrl.needsRespawn = false;
  }

  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) return;
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.016);
    this.lastFrameTime = currentTime;
    this.update(deltaTime);
    this.render(deltaTime);
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  loadLevel(sectionIndex, levelIndex) {
    const newLevel = this.levelManager.loadLevel(sectionIndex, levelIndex);
    if (!newLevel) { this.stop(); return; }
    
    this.currentLevel = newLevel;
    this.pauseForMenu = false;
    this.gameState.showingLevelComplete = false;
    this.collectedFruits = [];
    this.lastCheckpoint = null;
    this.fruitsAtLastCheckpoint.clear();
    this.soundManager.stopAll();
    this.entityManager = new EntityManager();

    this.playerEntityId = createPlayer(this.entityManager, this.currentLevel.startPosition.x, this.currentLevel.startPosition.y, this.gameState.selectedCharacter);

    this.camera.updateLevelBounds(this.currentLevel.width, this.currentLevel.height);
    this.camera.snapToPlayer(this.entityManager, this.playerEntityId);

    this.levelStartTime = performance.now();
    
    if (this.gameHasStarted) this.resume(); else this.start();
    eventBus.publish('levelLoaded', { gameState: this.gameState });
  }

  update(dt) {
    if (!this.currentLevel) return;

    if (this.isRunning && !this.gameState.showingLevelComplete) {
      this.levelTime = (performance.now() - this.levelStartTime) / 1000;
    }

    const canProcessGameplayInput = this.isRunning && !this.pauseForMenu && !this.gameState.showingLevelComplete;
    const inputActions = {
      moveLeft: canProcessGameplayInput && inputState.isKeyDown(this.keybinds.moveLeft),
      moveRight: canProcessGameplayInput && inputState.isKeyDown(this.keybinds.moveRight),
      jump: canProcessGameplayInput && inputState.isKeyDown(this.keybinds.jump),
      dash: canProcessGameplayInput && inputState.isKeyDown(this.keybinds.dash),
    };

    this.camera.update(this.entityManager, this.playerEntityId, dt);

    const context = { entityManager: this.entityManager, playerEntityId: this.playerEntityId, level: this.currentLevel, inputActions, camera: this.camera, isRunning: this.isRunning, dt, };
    for(const system of this.systems) system.update(dt, context);
    
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl && playerCtrl.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) this._respawnPlayer();

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
            if (collected.frame >= collected.collectedFrameCount) this.collectedFruits.splice(i, 1);
        }
    }

    if (playerCtrl && playerCtrl.despawnAnimationFinished && !this.gameState.showingLevelComplete) {
      this.gameState.onLevelComplete();
      playerCtrl.despawnAnimationFinished = false; 
      eventBus.publish('levelComplete', { deaths: playerCtrl.deathCount, time: this.levelTime });
    }

    eventBus.publish('statsUpdated', {
      levelName: this.currentLevel.name,
      collectedFruits: this.currentLevel.getFruitCount(),
      totalFruits: this.currentLevel.getTotalFruitCount(),
      deathCount: playerCtrl ? playerCtrl.deathCount : 0,
      levelTime: this.levelTime,
    });
  }

  _onPlayerDied() {
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    if (playerCtrl && !playerCtrl.needsRespawn) {
      playerCtrl.deathCount++;
      playerCtrl.needsRespawn = true;
    }
  }

  _respawnPlayer() {
    const respawnPosition = this.lastCheckpoint || this.currentLevel.startPosition;
    if (this.lastCheckpoint) this.currentLevel.fruits.forEach((fruit, index) => fruit.collected = this.fruitsAtLastCheckpoint.has(index));
    else this.currentLevel.fruits.forEach(f => f.collected = false);
    this.currentLevel.recalculateCollectedFruits();

    const pos = this.entityManager.getComponent(this.playerEntityId, PositionComponent);
    const vel = this.entityManager.getComponent(this.playerEntityId, VelocityComponent);
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    const renderable = this.entityManager.getComponent(this.playerEntityId, RenderableComponent);
    const collision = this.entityManager.getComponent(this.playerEntityId, CollisionComponent);

    pos.x = respawnPosition.x; pos.y = respawnPosition.y;
    vel.vx = 0; vel.vy = 0;

    const currentDeathCount = playerCtrl.deathCount;
    this.entityManager.removeComponent(this.playerEntityId, PlayerControlledComponent);
    this.entityManager.addComponent(this.playerEntityId, new PlayerControlledComponent({ deathCount: currentDeathCount }));
    
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
    eventBus.publish('playSound', { key: 'death_sound', volume: 0.3, channel: 'SFX' });
  }

  _onFruitCollected(fruit) {
    this.currentLevel.collectFruit(fruit);
    eventBus.publish('playSound', { key: 'collect', volume: 0.8, channel: 'SFX' });
    this.collectedFruits.push({ x: fruit.x, y: fruit.y, size: fruit.size, frame: 0, frameSpeed: 0.1, frameTimer: 0, collectedFrameCount: 6 });
  }

  _onCheckpointActivated(cp) {
      cp.state = 'activating';
      this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 }; 
      eventBus.publish('playSound', { key: 'checkpoint_activated', volume: 1, channel: 'UI' });
      this.fruitsAtLastCheckpoint.clear();
      this.currentLevel.fruits.forEach((fruit, index) => { if (fruit.collected) this.fruitsAtLastCheckpoint.add(index); });
      this.currentLevel.checkpoints.forEach(otherCp => { if (otherCp !== cp && otherCp.state === 'active') { otherCp.state = 'inactive'; otherCp.frame = 0; } });
  }

  _onTrophyCollision() {
    const playerCtrl = this.entityManager.getComponent(this.playerEntityId, PlayerControlledComponent);
    const renderable = this.entityManager.getComponent(this.playerEntityId, RenderableComponent);
    if (playerCtrl && !playerCtrl.isDespawning) {
      this.currentLevel.trophy.acquired = true;
      this.camera.shake(8, 0.3);
      playerCtrl.isDespawning = true;
      renderable.animationState = 'despawn';
      renderable.animationFrame = 0;
      renderable.animationTimer = 0;
      renderable.width = PLAYER_CONSTANTS.SPAWN_WIDTH;
      renderable.height = PLAYER_CONSTANTS.SPAWN_HEIGHT;
    }
  }
  
  render(dt) {
    if (!this.currentLevel) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderer.drawScrollingBackground(this.currentLevel, dt);
    this.renderer.renderScene(this.camera, this.currentLevel, this.entityManager, this.collectedFruits);
    this.particleSystem.render(this.ctx, this.camera);
    this.hud.drawGameHUD(this.ctx);
    this.uiSystem.render(this.ctx, this.isRunning);
  }
}