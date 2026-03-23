import { LitElement, html, css } from 'lit';

export class AnimatedSpriteCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .card {
      background-color: #555;
      border: 2px solid #777;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      height: 100%;
      box-sizing: border-box;
    }
    .canvas-container {
      width: 64px;
      height: 64px;
      background-color: #444;
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }
    canvas {
      image-rendering: pixelated;
      max-width: 100%;
      max-height: 100%;
    }
    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      flex-grow: 1;
    }

    /* Bare Mode (Overrides styles to display just the canvas smoothly) */
    :host([bare]) .card {
      background-color: transparent;
      border: none;
      padding: 0;
      gap: 0;
    }
    :host([bare]) .canvas-container {
      background-color: transparent;
      width: 100%;
      height: 100%;
    }
    :host([bare]) .content {
      display: none;
    }
    :host([bare]) canvas {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `;

  static properties = {
    sprite: { type: Object },
    frameCount: { type: Number },
    frameSpeed: { type: Number },
    bare: { type: Boolean, reflect: true },
    scaleToFit: { type: Boolean }
  };

  constructor() {
    super();
    this.frameCount = 1;
    this.frameSpeed = 0.1;
    this.bare = false;
    this.scaleToFit = false;
    this.animationFrameId = null;
    this.animState = { frame: 0, timer: 0, lastTime: 0 };
  }

  updated(changedProperties) {
    if (changedProperties.has('sprite') && this.sprite) {
        this.animState = { frame: 0, timer: 0, lastTime: 0 };
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.animationFrameId = requestAnimationFrame(this._animatePreview);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  _animatePreview = (timestamp) => {
    const canvas = this.shadowRoot.querySelector('canvas');
    if (!canvas || !this.sprite) {
      this.animationFrameId = requestAnimationFrame(this._animatePreview);
      return;
    }

    if (this.animState.lastTime === 0) this.animState.lastTime = timestamp;
    
    const deltaTime = (timestamp - this.animState.lastTime) / 1000;
    this.animState.lastTime = timestamp;
    this.animState.timer += deltaTime;

    const frameWidth = this.sprite.width / this.frameCount;

    let destW, destH, destX, destY;

    if (this.scaleToFit) {
        // Uniformly scale the sprite to fit the maximum possible bounds of the internal 64x64 canvas
        const scale = Math.min(canvas.width / frameWidth, canvas.height / this.sprite.height);
        destW = frameWidth * scale;
        destH = this.sprite.height * scale;
        destX = (canvas.width - destW) / 2;
        destY = (canvas.height - destH) / 2;
    } else {
        // Original logic: Center sprite in canvas if it's smaller, or scale down if larger
        destW = frameWidth > canvas.width ? canvas.width : frameWidth;
        destH = this.sprite.height > canvas.height ? canvas.height : this.sprite.height;
        destX = (canvas.width - destW) / 2;
        destY = (canvas.height - destH) / 2;
    }

    if (this.animState.timer >= this.frameSpeed) {
      this.animState.timer = 0;
      this.animState.frame = (this.animState.frame + 1) % this.frameCount;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        this.sprite,
        this.animState.frame * frameWidth, 0, frameWidth, this.sprite.height,
        destX, destY, destW, destH
      );
    }
    this.animationFrameId = requestAnimationFrame(this._animatePreview);
  }

  render() {
    return html`
      <div class="card">
        <div class="canvas-container">
            <canvas width="64" height="64"></canvas>
        </div>
        <div class="content">
            <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('animated-sprite-card', AnimatedSpriteCard);