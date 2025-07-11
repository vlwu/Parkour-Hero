import { Player } from '../entities/player.js';
import { createLevel1 } from '../entities/platform.js'; // Add this import

const FRUIT_NAMES = [
  'fruit_apple',
  'fruit_bananas',
  'fruit_cherries',
  'fruit_kiwi',
  'fruit_melon',
  'fruit_orange',
  'fruit_pineapple',
  'fruit_strawberry',
];

export class Engine {
  constructor(ctx, canvas, assets) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};

    // NEW: Initialize level system
    this.currentLevel = createLevel1();
    this.fruits = [...this.currentLevel.fruits]; // Copy fruits from level
    this.fruitCount = 0;
    this.fruitHighScore = 0;
    this.collectedFruits = []; // For collected fruit animations

    // Initialize player with assets and level starting position
    this.player = new Player(
      this.currentLevel.startPosition.x, 
      this.currentLevel.startPosition.y, 
      this.assets
    );

    this.initInput();
    
    // Log successful initialization for debugging
    console.log('Engine initialized successfully');
    console.log('Available assets:', Object.keys(this.assets));
    console.log('Level loaded:', this.currentLevel.name);
    console.log('Fruits in level:', this.fruits.length);
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;

      // Reset horizontal velocity when movement keys are released
      if (['a', 'd'].includes(e.key.toLowerCase())) {
        this.player.vx = 0;
      }
    });
  }

  start() {
    console.log('Starting game loop...');
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(timestamp) {
    // Calculate delta time for smooth frame-rate independent movement
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    // Cap delta time to prevent large jumps when tab is unfocused
    const cappedDeltaTime = Math.min(deltaTime, 0.016); // Max 60 FPS equivalent

    this.update(cappedDeltaTime);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    try {
      // Update player input and physics
      this.player.handleInput(this.keys);
      this.player.update(dt, this.canvas.height);

      // NEW: Update level fruits animation
      this.currentLevel.updateFruits(dt);

      // Update fruits animation frames - NOW ONLY for active fruits
      for (const fruit of this.fruits) {
        if (!fruit.collected) {
          fruit.frameTimer += dt;
          if (fruit.frameTimer >= fruit.frameSpeed) {
            fruit.frameTimer = 0;
            fruit.frame = (fruit.frame + 1) % fruit.frameCount;
          }
        }
      }

      // Update collected fruit animations
      this.collectedFruits = this.collectedFruits || [];

      for (const collected of this.collectedFruits) {
        collected.frameTimer += dt;
        if (collected.frameTimer >= collected.frameSpeed) {
          collected.frameTimer = 0;
          collected.frame++;

          // Remove when animation finishes
          if (collected.frame >= collected.collectedFrameCount) {
            collected.done = true;
          }
        }
      }
      this.collectedFruits = this.collectedFruits.filter(f => !f.done);

      // CHANGE: Update collision detection to mark fruits as collected in level
      this.fruits = this.fruits.filter((fruit) => {
        if (fruit.collected) return false; // Skip already collected fruits

        const dx = fruit.x - (this.player.x + this.player.width / 2);
        const dy = fruit.y - (this.player.y + this.player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collided = distance < (fruit.size / 2 + this.player.width / 2);

        if (collided) {
          fruit.collected = true; // Mark as collected in level
          this.fruitCount++;
          this.fruitHighScore = Math.max(this.fruitCount, this.fruitHighScore);
          
          this.collectedFruits.push({ // Trigger collected animation
            x: fruit.x,
            y: fruit.y,
            size: fruit.size,
            frame: 0,
            frameSpeed: 0.1,
            frameTimer: 0,
            collectedFrameCount: 6
          });
          console.log(`Collected ${fruit.spriteKey}! Total: ${this.fruitCount}`);
          
          return false; // remove fruit from active array
        }

        return true;
      });

      // NEW: Check if level is completed
      if (this.currentLevel.isCompleted()) {
        console.log('Level completed!');
        // TODO: Handle level completion (load next level, show completion screen, etc.)
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

      // Draw tiled background with proper error handling
      this.drawBackground();

      // NEW: Render level platforms
      this.currentLevel.render(ctx, assets);

      // Draw player
      this.player.render(ctx);

      // Draw animated fruits (only active ones)
      this.drawFruits();

      // Draw collected fruit animations
      for (const collected of this.collectedFruits) {
        const sprite = this.assets['fruit_collected'];
        if (!sprite) continue;

        const frameWidth = sprite.width / collected.collectedFrameCount;
        const frameHeight = sprite.height;
        const srcX = collected.frame * frameWidth;

        this.ctx.drawImage(
          sprite,
          srcX, 0,
          frameWidth, frameHeight,
          collected.x - collected.size / 2, collected.y - collected.size / 2,
          collected.size, collected.size
        );
      }

      // Draw HUD
      this.drawHUD();

    } catch (error) {
      console.error('Error in render loop:', error);
      // Draw error message on canvas
      ctx.fillStyle = 'red';
      ctx.font = '20px sans-serif';
      ctx.fillText('Rendering Error - Check Console', 10, 30);
    }
  }

  drawBackground() {
    const { ctx, canvas, assets } = this;
    const bg = assets.backgroundTile;
    
    // Check if background asset loaded successfully
    if (!bg) {
      console.warn('Background tile not loaded, using fallback');
      // Fallback: draw a simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue
      gradient.addColorStop(1, '#98FB98'); // Light green
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Background sprite sheet info - Blue.png is typically 64x64 with blue tile at position 0,0
    const spriteSize = 64;    // Each tile in the sprite sheet is 64x64
    const tileSize = 64;      // Size to draw each tile on screen
    
    // Source coordinates for the blue tile (usually top-left of sprite sheet)
    const srcX = 0;
    const srcY = 0;
    
    // Draw tiled background covering the entire canvas
    for (let x = 0; x < canvas.width; x += tileSize) {
      for (let y = 0; y < canvas.height; y += tileSize) {
        try {
          // Draw specific tile from sprite sheet
          ctx.drawImage(
            bg,                    // source image
            srcX, srcY,           // source x, y (position in sprite sheet)
            spriteSize, spriteSize, // source width, height
            x, y,                 // destination x, y
            tileSize, tileSize    // destination width, height
          );
        } catch (error) {
          console.warn('Failed to draw background tile:', error);
          // Fallback for individual tile
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }

  drawFruits() {
    const { ctx, assets } = this;
    
    // CHANGE: Only draw fruits that haven't been collected
    for (const fruit of this.fruits) {
      if (fruit.collected) continue; // Skip collected fruits

      try {
        const img = assets[fruit.spriteKey];
        
        if (!img) {
          console.warn(`Fruit sprite ${fruit.spriteKey} not loaded`);
          // Fallback: draw a colored circle
          ctx.fillStyle = '#FF6B6B';
          ctx.beginPath();
          ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        // Calculate sprite frame dimensions for fruit animation (17 frames)
        const frameWidth = img.width / fruit.frameCount;
        const frameHeight = img.height;
        
        // Calculate source position (which frame to draw)
        const srcX = frameWidth * fruit.frame;
        const srcY = 0;
        
        // Calculate destination position (centered on fruit position)
        const dx = fruit.x - fruit.size / 2;
        const dy = fruit.y - fruit.size / 2;

        // Draw the animated fruit sprite
        ctx.drawImage(
          img,                     // source image
          srcX, srcY,             // source x, y (frame position)
          frameWidth, frameHeight, // source width, height
          dx, dy,                 // destination x, y
          fruit.size, fruit.size  // destination width, height
        );
        
      } catch (error) {
        console.warn('Error drawing fruit:', error);
        // Fallback: draw a simple circle
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawHUD() {
    const { ctx } = this;

    try {
      // HUD box settings
      const hudX = 10;
      const hudY = 10;
      const hudWidth = 280; // Made wider for more info
      const hudHeight = 80;  // Made taller for level info

      // Draw semi-transparent HUD background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(hudX, hudY, hudWidth, hudHeight);

      // Text style
      ctx.font = '18px sans-serif';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'white';

      // NEW: Text lines with level info
      const totalFruits = this.currentLevel.fruits.length;
      const collectedFruits = this.currentLevel.getFruitCount();
      const lines = [
        `Level: ${this.currentLevel.name}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `High Score: ${this.fruitHighScore}`
      ];

      // Line height and top offset to vertically center within the box
      const lineHeight = 22;
      const totalTextHeight = lines.length * lineHeight;
      const startY = hudY + (hudHeight - totalTextHeight) / 2 + lineHeight - 6;

      // X-position to left-align nicely with some margin
      const textX = hudX + hudWidth / 2;

      // Draw each line
      lines.forEach((text, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(text, textX, y);
        ctx.fillText(text, textX, y);
      });

    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}