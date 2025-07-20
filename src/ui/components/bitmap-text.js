import { LitElement, html } from 'lit';

export class BitmapText extends LitElement {
  static properties = {
    fontRenderer: { type: Object },
    text: { type: String },
    scale: { type: Number },
    color: { type: String },
    outlineColor: { type: String },
    outlineWidth: { type: Number },
    align: { type: String },
  };

  constructor() {
    super();
    this.text = '';
    this.scale = 1;
    this.color = 'white';
    this.outlineColor = null;
    this.outlineWidth = 1;
    this.align = 'left';
  }

  // Lit's lifecycle hook that runs after the component's DOM has been updated.
  updated(changedProperties) {
    super.updated(changedProperties);
    
    // We only need to re-render the canvas if a property that affects the text has changed.
    if (!this.fontRenderer || !this.shadowRoot) return;

    this.renderCanvas();
  }
  
  renderCanvas() {
    const container = this.shadowRoot.querySelector('#container');
    if (!container) return;

    // Call the existing, imperative font rendering function
    const canvas = this.fontRenderer.renderTextToCanvas(this.text, {
      scale: this.scale,
      color: this.color,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth,
      align: this.align,
    });

    if (canvas) {
        canvas.style.imageRendering = 'pixelated';
        // Clear previous canvas and append the new one
        container.innerHTML = '';
        container.appendChild(canvas);
    }
  }

  // The component's template is just a container for our canvas.
  render() {
    return html`<div id="container"></div>`;
  }
}

customElements.define('bitmap-text', BitmapText);