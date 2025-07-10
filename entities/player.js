export class Player {
  constructor(x, y, assets) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 25;
    this.vx = 0;
    this.vy = 0;
    this.jumpCount = 0;
    this.direction = 'right';
    this.state = 'idle';
    this.isJumping = false;
    this.assets = assets;
  }

  handleInput(keys) {
    if (keys['a']) {
      this.vx = -3;
      this.direction = 'left';
      this.state = 'run';
    } else if (keys['d']) {
      this.vx = 3;
      this.direction = 'right';
      this.state = 'run';
    }

    if (keys['w'] && this.jumpCount < 2) {
      this.vy = -3.5;
      this.jumpCount++;
      this.isJumping = true;
    }
  }

  update(dt, canvasHeight) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12; // gravity

    // Collision with ground
    if (this.y > canvasHeight - this.height) {
      this.y = canvasHeight - this.height;
      this.vy = 0;
      this.jumpCount = 0;
      this.isJumping = false;
    }

    // Wall boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > 700 - this.width) this.x = 700 - this.width;
  }

  render(ctx) {
    // Placeholder — replace with sprite later
    ctx.fillStyle = 'orange';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Optionally: Draw jump/fall image here
    // ctx.drawImage(this.assets.playerJump, this.x, this.y, this.width, this.height);
  }
}
