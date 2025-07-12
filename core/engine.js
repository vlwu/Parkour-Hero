import { Player } from '../entities/player.js';
import { createLevel } from '../entities/platform.js'; 
import { levelSections } from '../entities/levels.js'; 

export class Engine {
  constructor(ctx, canvas, assets, initialKeybinds) { // Added initialKeybinds parameter
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.keybinds = initialKeybinds; // Store keybinds
    this.isRunning = false; // Track if the game loop is active

    // Level progression system
    this.currentSection = 0;  // First section (0-based index)
    this.currentLevelIndex = 0;    // First level in section (0-based index)
    this.levelProgress = this.loadProgress(); // Load saved progress
    
    // Initialize the current level
    this.loadLevel(this.currentSection, this.currentLevelIndex);

    this.initInput();

    // Log successful initialization for debugging
    console.log('Engine initialized successfully');
    console.log('Available assets:', Object.keys(this.assets));
    console.log('Level loaded:', this.currentLevel.name);
    console.log('Fruits in level:', this.fruits.length);
  }

  // Method to update keybinds from outside (e.g., from UI)
  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds }; // Create a new object to ensure reactivity
    console.log('Keybinds updated:', this.keybinds);
  }

    // Load level based on section and level indices
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
    
    // Initialize player with assets and level starting position
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      this.assets
    );
    
    console.log(`Loaded: ${this.currentLevel.name}`);
  }

  // Advance to next level
  advanceLevel() {
    const currentSection = levelSections[this.currentSection];
    
    // Check if there's another level in this section
    if (this.currentLevelIndex + 1 < currentSection.length) {
      this.currentLevelIndex++;
      this.loadLevel(this.currentSection, this.currentLevelIndex);
      return;
    }
    
    // Check if there's another section
    if (this.currentSection + 1 < levelSections.length) {
      this.currentSection++;
      this.currentLevelIndex = 0;
      this.loadLevel(this.currentSection, this.currentLevelIndex);
      return;
    }
    
    // Game completed! For now, loop back to first level
    console.log("Congratulations! You've completed all levels!");
    this.currentSection = 0;
    this.currentLevelIndex = 0;
    this.loadLevel(this.currentSection, this.currentLevelIndex);
  }

  // Save progress to localStorage
  saveProgress() {
    const progress = {
      section: this.currentSection,
      level: this.currentLevelIndex,
    };
    localStorage.setItem('gameProgress', JSON.stringify(progress));
  }

  // Load progress from localStorage
  loadProgress() {
    const saved = localStorage.getItem('gameProgress');
    return saved ? JSON.parse(saved) : { section: 0, level: 0 };
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      // Only process input if game is running (not paused by modal)
      if (this.isRunning) {
        this.keys[e.key.toLowerCase()] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      // Only process input if game is running (not paused by modal)
      if (this.isRunning) {
        this.keys[e.key.toLowerCase()] = false;

        // Reset horizontal velocity when movement keys are released
        // Check if the released key is one of the currently bound movement keys
        if (e.key.toLowerCase() === this.keybinds.moveLeft || e.key.toLowerCase() === this.keybinds.moveRight) {
          this.player.vx = 0;
        }
      }
    });
  }

  start() {
    console.log('Starting game loop...');
    this.isRunning = true;
    requestAnimationFrame(this.loop.bind(this));
  }

  pause() {
    console.log('Game paused.');
    this.isRunning = false;
  }

  resume() {
    console.log('Game resumed.');
    this.isRunning = true;
    this.lastFrameTime = performance.now(); // Reset lastFrameTime to prevent large deltaTime after pause
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(timestamp) {
    if (!this.isRunning) {
      return; // Stop the loop if game is paused
    }

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
      // Create a temporary object to pass to player.handleInput
      // This maps the abstract actions to the currently bound keys
      const inputActions = {
        moveLeft: this.keys[this.keybinds.moveLeft] || false,
        moveRight: this.keys[this.keybinds.moveRight] || false,
        jump: this.keys[this.keybinds.jump] || false,
        dash: this.keys[this.keybinds.dash] || false,
      };

      // Update player input and physics
      this.player.handleInput(inputActions); // Pass the mapped input state
      this.player.update(dt, this.canvas.height, this.currentLevel);

      // Check if player needs to respawn
      if (this.player.needsRespawn) { 
        console.log('Player fell off, resetting level...');
        this.currentLevel.reset(); // Reset fruits and trophy
        this.player.respawn(this.currentLevel.startPosition);
      }

      // Update level fruits animation (managed by Level class)
      this.currentLevel.updateFruits(dt);
      // Update trophy animation (managed by Level class)
      this.currentLevel.updateTrophyAnimation(dt);


      // Update collected fruit animations (these are separate visual effects)
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

      // Update collision detection to mark fruits as collected in level
      // Iterate over a copy to safely modify the original array during filtering
      this.currentLevel.fruits = this.currentLevel.fruits.filter((fruit) => {
        if (fruit.collected) return true; // Keep already collected fruits in the level's array

        const dx = fruit.x - (this.player.x + this.player.width / 2);
        const dy = fruit.y - (this.player.y + this.player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collided = distance < (fruit.size / 2 + this.player.width / 2);

        if (collided) {
          fruit.collected = true; // Mark as collected in level
          // The fruitCount is now derived from the level itself

          this.collectedFruits.push({ // Trigger collected animation
            x: fruit.x,
            y: fruit.y,
            size: fruit.size,
            frame: 0,
            frameSpeed: 0.1,
            frameTimer: 0,
            collectedFrameCount: 6
          });
          console.log(`Collected ${fruit.spriteKey}! Total: ${this.currentLevel.getFruitCount()}`);

          return true; // Keep the fruit in the level's array, just mark it collected
        }

        return true; // Keep uncollected fruits
      });

    // Trophy collision handling
    const trophy = this.currentLevel.trophy;
    if (trophy && !trophy.acquired && !trophy.inactive) {
      const px = this.player.x, py = this.player.y, pw = this.player.width, ph = this.player.height;
      const tx = trophy.x - trophy.size / 2, ty = trophy.y - trophy.size / 2, ts = trophy.size;

      if (px + pw > tx && px < tx + ts && py + ph > ty && py < ty + ts) {
        trophy.acquired = true;
        console.log('Trophy acquired!');
      }
    }

    // Check if level is completed
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

      // Draw tiled background
      this.drawBackground();

      // Render level platforms and trophy (handled by Level.render)
      this.currentLevel.render(ctx, assets);

      // Draw player
      this.player.render(ctx);

      // Draw animated fruits (only active ones from the level)
      this.drawFruits();

      // Draw collected fruit animations (optimized for performance)
      // Use a for loop instead of for...of for better performance in tight loops
      const collectedArr = this.collectedFruits;
      const sprite = this.assets['fruit_collected'];
      if (sprite) {
        const frameWidth = sprite.width / 6; // 6 frames for collected animation
        const frameHeight = sprite.height;
        for (let i = 0, len = collectedArr.length; i < len; i++) {
          const collected = collectedArr[i];
          const srcX = collected.frame * frameWidth; // Calculate source X for current frame
          this.ctx.drawImage( // Draw the collected fruit animation frame, centered on fruit position
        sprite,
        srcX, 0,
        frameWidth, frameHeight,
        collected.x - collected.size / 2, collected.y - collected.size / 2,
        collected.size, collected.size
          );
        }
      }
      // If sprite is missing, skip drawing collected animations for performance

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
    const tilesX = Math.ceil(canvas.width / tileSize); // Pre-calculate number of tiles to avoid unnecessary iterations
    const tilesY = Math.ceil(canvas.height / tileSize);

    for (let i = 0; i < tilesX; i++) {
      const x = i * tileSize;
      for (let j = 0; j < tilesY; j++) {
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
        // Only log once per frame for performance
        if (i === 0 && j === 0) {
        console.warn('Failed to draw background tile:', error);
        }
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
      }
    }
  }

  // Draw all uncollected fruits in the current level
  drawFruits() {
    const { ctx, assets } = this;

    // Use a for loop for performance (avoids array iterator overhead)
    const fruits = this.currentLevel.fruits;
    for (let i = 0, len = fruits.length; i < len; i++) {
      const fruit = fruits[i];
      if (fruit.collected) continue; // Skip collected fruits

      // Try to draw the fruit sprite, fallback to circle if missing or error
      try {
        const img = assets[fruit.spriteKey];

        if (!img) {
          // Sprite not loaded: fallback to simple colored circle
          ctx.fillStyle = '#FF6B6B';
          ctx.beginPath();
          ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        // Calculate frame dimensions for fruit animation (assume 17 frames)
        const frameWidth = img.width / fruit.frameCount;
        const srcX = frameWidth * fruit.frame;

        // Draw the animated fruit sprite, centered on fruit position
        ctx.drawImage(
          img,
          srcX, 0, frameWidth, img.height, // Source rect (frame)
          fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, // Dest position
          fruit.size, fruit.size // Dest size
        );

      } catch (error) {
        // Drawing failed: fallback to simple colored circle
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // Only log once per frame for performance
        if (i === 0) console.warn('Error drawing fruit:', error);
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

      // Determine font size based on number of lines
      const totalFruits = this.currentLevel.getTotalFruitCount(); // Use Level method
      const collectedFruits = this.currentLevel.getFruitCount();   // Use Level method
      const lines = [
        `${this.currentLevel.name}`,
        `Fruits: ${collectedFruits}/${totalFruits}`,
        `Deaths: `, // TODO implement death count
      ];

      // Adjust font size: more lines = smaller font
      let fontSize = 18;
      if (lines.length >= 4) fontSize = 15;
      else if (lines.length === 3) fontSize = 17;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'white';

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
