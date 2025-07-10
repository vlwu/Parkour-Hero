// Import Player class - this was missing!
import { Player } from '../entities/player.js';

const FRUIT_NAMES = [
  'fruit_apple',
  'fruit_bananas',
  'fruit_cherries',
  'fruit_kiwi',
  'fruit_melon',
  'fruit_orange',
  'fruit_pineapple',
  'fruit_strawberry'
];

export class Engine {
  constructor(ctx, canvas, assets) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.lastFrameTime = 0;
    this.keys = {};
    this.fruits = [];
    this.fruitCount = 0;
    this.fruitHighScore = 0;

    // Initialize player with assets
    this.player = new Player(250, 350, this.assets);

    this.initInput();
    
    // Log successful initialization for debugging
    console.log('Engine initialized successfully');
    console.log('Available assets:', Object.keys(this.assets));
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

      // Spawn fruits randomly every 4 seconds (approx) with better timing
      const currentTime = performance.now() / 1000;
      if (Math.floor(currentTime) % 4 === 0 && 
          Math.floor(currentTime) !== Math.floor(currentTime - dt) && 
          this.fruits.length < 10) {
        
        const fruitKey = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)];

        this.fruits.push({
          x: Math.random() * (this.canvas.width - 40) + 20,
          y: Math.random() * (this.canvas.height - 100) + 20, // Avoid spawning too close to ground
          size: 30,
          spriteKey: fruitKey,
          frame: 0,          // current animation frame
          frameCount: 17,    // total frames in fruit animation
          frameSpeed: 0.1,   // frames per update
          frameTimer: 0      // timer to switch frames
        });
      }

      // Update fruits animation frames
      for (const fruit of this.fruits) {
        fruit.frameTimer += dt;
        if (fruit.frameTimer >= fruit.frameSpeed) {
          fruit.frameTimer = 0;
          fruit.frame = (fruit.frame + 1) % fruit.frameCount;
        }
      }

      // Collision detection with fruits
      this.fruits = this.fruits.filter((fruit) => {
        const dx = fruit.x - (this.player.x + this.player.width / 2);
        const dy = fruit.y - (this.player.y + this.player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collided = distance < (fruit.size / 2 + this.player.width / 2);

        if (collided) {
          this.fruitCount++;
          this.fruitHighScore = Math.max(this.fruitCount, this.fruitHighScore);
          // TODO: Trigger collected animation if desired
          return false; // remove fruit from array
        }

        return true;
      });
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

      // Draw player
      this.player.render(ctx);

      // Draw animated fruits
      this.drawFruits();

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

    // Calculate tile size - your background is 64x64 based on common pixel art standards
    const tileSize = 64;
    
    // Draw tiled background covering the entire canvas
    for (let x = 0; x < canvas.width; x += tileSize) {
      for (let y = 0; y < canvas.height; y += tileSize) {
        try {
          ctx.drawImage(bg, x, y, tileSize, tileSize);
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
    
    for (const fruit of this.fruits) {
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

        // Calculate sprite frame dimensions
        const frameWidth = img.width / fruit.frameCount;
        const sx = frameWidth * fruit.frame;
        const sy = 0;
        const sWidth = frameWidth;
        const sHeight = img.height;
        
        // Calculate destination position (centered on fruit position)
        const dx = fruit.x - fruit.size / 2;
        const dy = fruit.y - fruit.size / 2;
        const dWidth = fruit.size;
        const dHeight = fruit.size;

        // Draw the animated fruit sprite
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        
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
      // Draw semi-transparent background for HUD
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 200, 60);
      
      // Draw text with outline for better visibility
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      
      // Fruit count
      ctx.strokeText(`Fruits: ${this.fruitCount}`, 20, 30);
      ctx.fillText(`Fruits: ${this.fruitCount}`, 20, 30);
      
      // High score
      ctx.strokeText(`High Score: ${this.fruitHighScore}`, 20, 55);
      ctx.fillText(`High Score: ${this.fruitHighScore}`, 20, 55);
      
    } catch (error) {
      console.warn('Error drawing HUD:', error);
    }
  }
}