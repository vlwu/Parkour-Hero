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

    this.player = new Player(250, 350, this.assets);

    this.initInput();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;

      if (['a', 'd'].includes(e.key.toLowerCase())) {
        this.player.vx = 0;
      }
    });
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(timestamp) {
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.player.handleInput(this.keys);
    this.player.update(dt, this.canvas.height);

    // Spawn fruits randomly every 4 seconds (approx)
    if (Math.floor(performance.now() / 1000) % 4 === 0 && this.fruits.length < 10) {
      const fruitKey = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)];

      this.fruits.push({
        x: Math.random() * (this.canvas.width - 40) + 20,
        y: Math.random() * (this.canvas.height - 40) + 20,
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

    // Collision with fruits
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
  }

  render() {
    const { ctx, canvas, assets } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (basic tiled)
    const bg = assets.backgroundTile;
    for (let i = 0; i < canvas.width; i += 75) {
      for (let j = 0; j < canvas.height; j += 75) {
        ctx.drawImage(bg, i, j, 75, 75);
      }
    }

    // Player
    this.player.render(ctx);

    // Draw animated fruits
    for (const fruit of this.fruits) {
      const img = assets[fruit.spriteKey];
      const frameWidth = img.width / fruit.frameCount;
      const sx = frameWidth * fruit.frame;
      const sy = 0;
      const sWidth = frameWidth;
      const sHeight = img.height;
      const dx = fruit.x - fruit.size / 2;
      const dy = fruit.y - fruit.size / 2;
      const dWidth = fruit.size;
      const dHeight = fruit.size;

      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Fruits: ${this.fruitCount}`, 20, 30);
    ctx.fillText(`High Score: ${this.fruitHighScore}`, 20, 60);
  }
}
