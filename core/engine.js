// Modified engine.js - showing the key changes needed

import { Player } from '../entities/player.js';
import { createLevel } from '../entities/platform.js'; 
import { levelSections } from '../entities/levels.js';
import { Camera } from './camera.js'; // Import the camera

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.keybinds = initialKeybinds;
    this.isRunning = false;
    
    // Initialize camera
    this.camera = new Camera(canvas.width, canvas.height);
    
    // Level progression system
    this.currentSection = 0;
    this.currentLevelIndex = 0;
    this.levelProgress = this.loadProgress();
    
    // Initialize the current level
    this.loadLevel(this.currentSection, this.currentLevelIndex);
    
    // Snap camera to player initial position
    this.camera.snapToPlayer(this.player);

    this.initInput();

    console.log('Engine initialized successfully');
  }

  loadLevel(sectionIndex, levelIndex) {
    // Validate indices
    if (sectionIndex >= levelSections.length || 
        levelIndex >= levelSections[sectionIndex].length) {
      console.error(`Invalid level: Section ${sectionIndex}, Level ${levelIndex}`);
      return;
    }

    this.currentSection = sectionIndex;
    this.currentLevelIndex = levelIndex;
    this.currentLevel = createLevel(levelSections[sectionIndex][levelIndex]);
    this.fruits = this.currentLevel.fruits;
    this.fruitCount = 0;
    this.collectedFruits = [];
    
    // Initialize player
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets
    );
    
    // Update camera bounds for new level and snap to player
    this.camera.updateLevelBounds(this.currentLevel.width || 1280, this.currentLevel.height || 720);
    this.camera.snapToPlayer(this.player);
    
    console.log(`Loaded: ${this.currentLevel.name}`);
  }

  update(dt) {
    try {
      // Create input actions object
      const inputActions = {
        moveLeft: this.keys[this.keybinds.moveLeft] || false,
        moveRight: this.keys[this.keybinds.moveRight] || false,
        jump: this.keys[this.keybinds.jump] || false,
        dash: this.keys[this.keybinds.dash] || false,
      };

      // Update player
      this.player.handleInput(inputActions);
      this.player.update(dt, this.canvas.height, this.currentLevel);

      // Update camera to follow player
      this.camera.update(this.player, dt);

      // Check if player needs to respawn
      if (this.player.needsRespawn) { 
        console.log('Player fell off, resetting level...');
        this.currentLevel.reset();
        this.player.respawn(this.currentLevel.startPosition);
        
        // Add screen shake for death
        this.camera.shake(15, 0.5);
      }

      // Update level animations
      this.currentLevel.updateFruits(dt);
      this.currentLevel.updateTrophyAnimation(dt);

      // Update collected fruit animations
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

      // Fruit collection with screen shake
      this.currentLevel.fruits = this.currentLevel.fruits.filter((fruit) => {
        if (fruit.collected) return true;

        const dx = fruit.x - (this.player.x + this.player.width / 2);
        const dy = fruit.y - (this.player.y + this.player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collided = distance < (fruit.size / 2 + this.player.width / 2);

        if (collided) {
          fruit.collected = true;
          
          // Add small screen shake for fruit collection
          this.camera.shake(3, 0.2);

          this.collectedFruits.push({
            x: fruit.x,
            y: fruit.y,
            size: fruit.size,
            frame: 0,
            frameSpeed: 0.1,
            frameTimer: 0,
            collectedFrameCount: 6
          });
          
          console.log(`Collected ${fruit.spriteKey}! Total: ${this.currentLevel.getFruitCount()}`);
          return true;
        }

        return true;
      });

      // Trophy collision with screen shake
      const trophy = this.currentLevel.trophy;
      if (trophy && !trophy.acquired && !trophy.inactive) {
        const px = this.player.x, py = this.player.y, pw = this.player.width, ph = this.player.height;
        const tx = trophy.x - trophy.size / 2, ty = trophy.y - trophy.size / 2, ts = trophy.size;

        if (px + pw > tx && px < tx + ts && py + ph > ty && py < ty + ts) {
          trophy.acquired = true;
          
          // Add screen shake for trophy collection
          this.camera.shake(8, 0.4);
          
          console.log('Trophy acquired!');
        }
      }

      // Check level completion
      if (this.currentLevel.isCompleted()) {
        console.log('Level completed!');
        this.saveProgress();
        this.advanceLevel();
      }

    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }

  render() {
    try {
      const { ctx, canvas, assets } = this;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply camera transformation
      this.camera.apply(ctx);

      // Draw tiled background (now affected by camera)
      this.drawBackground();

      // Render level platforms and trophy
      this.currentLevel.render(ctx, assets);

      // Draw player
      this.player.render(ctx);

      // Draw fruits
      this.drawFruits();

      // Draw collected fruit animations
      this.drawCollectedFruits();

      // Restore camera transformation
      this.camera.restore(ctx);

      // Draw HUD (not affected by camera)
      this.drawHUD();

      // Draw camera debug info (uncomment for debugging)
      // this.camera.drawDebug(ctx);

    } catch (error) {
      console.error('Error in render loop:', error);
      ctx.fillStyle = 'red';
      ctx.font = '20px sans-serif';
      ctx.fillText('Rendering Error - Check Console', 10, 30);
    }
  }

  drawBackground() {
    const { ctx, canvas, assets } = this;
    const bg = assets.backgroundTile;

    if (!bg) {
      console.warn('Background tile not loaded, using fallback');
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      ctx.fillStyle = gradient;
      ctx.fillRect(this.camera.x, this.camera.y, canvas.width, canvas.height);
      return;
    }

    const spriteSize = 64;
    const tileSize = 64;
    const srcX = 0;
    const srcY = 0;

    // Calculate which tiles are visible based on camera position
    const startX = Math.floor(this.camera.x / tileSize);
    const startY = Math.floor(this.camera.y / tileSize);
    const endX = Math.ceil((this.camera.x + canvas.width) / tileSize);
    const endY = Math.ceil((this.camera.y + canvas.height) / tileSize);

    // Only draw visible tiles for better performance
    for (let i = startX; i <= endX; i++) {
      const x = i * tileSize;
      for (let j = startY; j <= endY; j++) {
        const y = j * tileSize;
        try {
          ctx.drawImage(
            bg,
            srcX, srcY,
            spriteSize, spriteSize,
            x, y,
            tileSize, tileSize
          );
        } catch (error) {
          if (i === startX && j === startY) {
            console.warn('Failed to draw background tile:', error);
          }
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }

  drawFruits() {
    const { ctx, assets } = this;
    const fruits = this.currentLevel.fruits;
    
    for (let i = 0, len = fruits.length; i < len; i++) {
      const fruit = fruits[i];
      if (fruit.collected) continue;

      // Only draw fruits that are visible to the camera
      if (!this.camera.isVisible(fruit.x - fruit.size/2, fruit.y - fruit.size/2, fruit.size, fruit.size)) {
        continue;
      }

      try {
        const img = assets[fruit.spriteKey];
        if (!img) {
          ctx.fillStyle = '#FF6B6B';
          ctx.beginPath();
          ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        const frameWidth = img.width / fruit.frameCount;
        const srcX = frameWidth * fruit.frame;

        ctx.drawImage(
          img,
          srcX, 0, frameWidth, img.height,
          fruit.x - fruit.size / 2, fruit.y - fruit.size / 2,
          fruit.size, fruit.size
        );

      } catch (error) {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
        ctx.fill();
        if (i === 0) console.warn('Error drawing fruit:', error);
      }
    }
  }

  drawCollectedFruits() {
    const { ctx, assets } = this;
    const collectedArr = this.collectedFruits;
    const sprite = assets['fruit_collected'];
    
    if (!sprite) return;

    const frameWidth = sprite.width / 6;
    const frameHeight = sprite.height;
    
    for (let i = 0, len = collectedArr.length; i < len; i++) {
      const collected = collectedArr[i];
      
      // Only draw if visible to camera
      if (!this.camera.isVisible(collected.x - collected.size/2, collected.y - collected.size/2, collected.size, collected.size)) {
        continue;
      }
      
      const srcX = collected.frame * frameWidth;
      ctx.drawImage(
        sprite,
        srcX, 0,
        frameWidth, frameHeight,
        collected.x - collected.size / 2, collected.y - collected.size / 2,
        collected.size, collected.size
      );
    }
  }

  drawHUD() {
    const { ctx } = this;

    try {
      // Save context to avoid camera transform affecting HUD
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const hudX = 10;
      const hudY = 10;
      const hudWidth = 280;
      const hudHeight = 80;

      // Draw HUD background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(hudX, hudY, hudWidth, hudHeight);

      const totalFruits = this.currentLevel.getTotalFruitCount();
      const collectedFruits = this.currentLevel.getFruitCount();
      const lines = [
        `${this.currentLevel.name}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: ${this.player.deathCount || 0}`,
      ];

      let fontSize = 18;
      if (lines.length >= 4) fontSize = 15;
      else if (lines.length === 3) fontSize = 17;
      
      ctx.font = `${fontSize}px sans-serif`;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'white';

      const lineHeight = 22;
      const totalTextHeight = lines.length * lineHeight;
      const startY = hudY + (hudHeight - totalTextHeight) / 2 + lineHeight - 6;
      const textX = hudX + hudWidth / 2;

      lines.forEach((text, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(text, textX, y);
        ctx.fillText(text, textX, y);
      });

      ctx.restore();

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }

  // Add method to get camera for external access
  getCamera() {
    return this.camera;
  }

  // Add method to manually trigger screen shake
  shakeScreen(intensity = 10, duration = 0.3) {
    this.camera.shake(intensity, duration);
  }
}