import { Player } from '../entities/player.js';
import { levelSections } from '../entities/levels.js';
import { Level } from '../entities/platform.js';
import { Camera } from './camera.js';
import { SoundManager } from './sound.js';
import { HUD } from '../ui/hud.js';
import { GameState } from './game-state.js';
import { PhysicsSystem } from './physics-system.js'; // IMPORT a PhysicsSystem now
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
    this.menuManager = null; // Will be set externally after initialization

    this.lastCheckpoint = null; 
    this.fruitsAtLastCheckpoint = new Set();

    this.camera = new Camera(canvas.width, canvas.height);
    this.hud = new HUD(canvas);
    this.soundManager = new SoundManager();
    this.soundManager.loadSounds(assets);
    this.physicsSystem = new PhysicsSystem(); // INSTANTIATE PhysicsSystem
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

    this.particles = [];
  }
  
  updatePlayerCharacter() {
    if (this.player) {
      this.player.characterId = this.gameState.selectedCharacter;
      console.log(`Character skin changed to: ${this.gameState.selectedCharacter}`);
    }
  }

  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds };
  }

  getSoundManager() {
    return this.soundManager;
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
      if (this.menuManager) {
        this.menuManager.updatePauseButtonIcon();
      }
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
    if (this.menuManager) {
        this.menuManager.updatePauseButtonIcon();
    }
  }

  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) {
      if (this.menuManager) this.menuManager.updatePauseButtonIcon();
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

    this.gameState.showingLevelComplete = false;
    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;
    this.currentLevel = new Level(levelSections[sectionIndex].levels[levelIndex]);

    this.collectedFruits = [];
    this.particles = []; // Clear particles on level load

    this.lastCheckpoint = null; // Reset the last checkpoint on level load
    this.fruitsAtLastCheckpoint.clear(); // Also clear the fruit state from the last checkpoint
    
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets,
      this.gameState.selectedCharacter // Pass selected character
    );
    this.player.isSpawning = true;
    this.player.spawnComplete = false;
    this.player.state = 'spawn';
    this.player.deathCount = 0;

    this.camera.updateLevelBounds(this.currentLevel.width || 1280, this.currentLevel.height || 720);
    this.camera.snapToPlayer(this.player);

    this.levelStartTime = performance.now();
    this.resume();
}
  update(dt) {
    try {
      if (this.isRunning && !this.gameState.showingLevelComplete) {
        this.levelTime = (performance.now() - this.levelStartTime) / 1000;
      }

      // --- NEW UPDATE ORDER ---

      // 1. GATHER INPUT
      const inputActions = {
        moveLeft: this.keys[this.keybinds.moveLeft] || false,
        moveRight: this.keys[this.keybinds.moveRight] || false,
        jump: this.keys[this.keybinds.jump] || false,
        dash: this.keys[this.keybinds.dash] || false,
      };

      // 2. PROCESS INPUT: Player determines its intent based on raw input.
      this.player.handleInput(inputActions);
      
      // 3. APPLY PHYSICS: The PhysicsSystem moves the player and resolves all collisions.
      const collisionResults = this.physicsSystem.update(
        this.player,
        this.currentLevel,
        dt,
        inputActions
      );

      // 4. UPDATE ENTITY STATE: Player updates its animation/state based on the results of the physics step.
      this.player.update(dt);
      
      // 5. PROCESS EVENTS & COLLISION RESULTS
      this.processPlayerEvents();
      this.updateParticles(dt);
      
      this.camera.update(this.player, dt);

      if (this.player.needsRespawn && !this.gameState.showingLevelComplete && this.isRunning) {
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

      if (collisionResults.newlyCollectedFruits.length > 0) {
        for (const fruit of collisionResults.newlyCollectedFruits) {
          this.currentLevel.collectFruit(fruit);
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
          this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 }; 
          this.soundManager.play('checkpoint_activated', 1); 

          this.fruitsAtLastCheckpoint.clear();
          this.currentLevel.fruits.forEach((fruit, index) => {
              if (fruit.collected) {
                  this.fruitsAtLastCheckpoint.add(index);
              }
          });

          this.currentLevel.checkpoints.forEach(otherCp => {
              if (otherCp !== cp && otherCp.state === 'active') {
                  otherCp.state = 'inactive';
                  otherCp.frame = 0;
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
        this.player.despawnAnimationFinished = false; 
        if (this.menuManager) {
            this.menuManager.showLevelCompleteScreen(this.player.deathCount, this.levelTime);
        }
      }

    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }

  processPlayerEvents() {
    // Process sound events emitted by the player (e.g., surface sounds)
    const soundEvents = this.player.getAndClearSoundEvents();
    for (const event of soundEvents) {
      if (event.type === 'playLoop') {
        this.soundManager.playLoop(event.key);
      } else if (event.type === 'stopLoop') {
        this.soundManager.stopLoop(event.key);
      }
    }

    // Process action events for one-shot sounds and particles
    if (this.player.dashedThisFrame) {
      this.soundManager.play('dash', 0.7);
      this.createDustParticles(this.player.getCenterX(), this.player.getCenterY(), 'dash', this.player.direction);
      this.player.dashedThisFrame = false; // Reset flag
    }

    if (this.player.jumpedThisFrame > 0) {
      if (this.player.jumpedThisFrame === 1) {
        this.soundManager.play('jump', 0.8);
      } else if (this.player.jumpedThisFrame === 2) {
        this.soundManager.play('double_jump', 0.6);
        this.createDustParticles(this.player.getCenterX(), this.player.y + this.player.height, 'double_jump');
      }
      this.player.jumpedThisFrame = 0; // Reset flag
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

      this.hud.drawGameHUD(this.ctx, this.currentLevel, this.player, this.soundManager);

    } catch (error) {
      console.error('Error in render loop:', error);
      this.ctx.fillStyle = 'red';
      this.ctx.font = '20px sans-serif';
      this.ctx.fillText('Rendering Error - Check Console', 10, 30);
    }
  }

    handleCanvasClick(x, y) {
      // This method is now empty because all UI clicks are handled
      // by DOM event listeners in MenuManager.
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