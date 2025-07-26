import { eventBus } from '../utils/event-bus.js';

export class UISystem {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;
        this.hoveredButton = null;
        
        const buttonSize = 64;
        const rightPadding = 20;
        const topPadding = 20;
        const buttonGap = 10;
        const buttonX = this.canvas.width - buttonSize - rightPadding;

        this.uiButtons = [
            { id: 'settings', x: buttonX, y: topPadding + (buttonSize + buttonGap) * 0, width: buttonSize, height: buttonSize, assetKey: 'settings_icon', visible: false },
            { id: 'pause', x: buttonX, y: topPadding + (buttonSize + buttonGap) * 1, width: buttonSize, height: buttonSize, assetKey: 'pause_icon', visible: false },
            { id: 'levels', x: buttonX, y: topPadding + (buttonSize + buttonGap) * 2, width: buttonSize, height: buttonSize, assetKey: 'levels_icon', visible: false },
            { id: 'character', x: buttonX, y: topPadding + (buttonSize + buttonGap) * 3, width: buttonSize, height: buttonSize, assetKey: 'character_icon', visible: false },
            { id: 'info', x: buttonX, y: topPadding + (buttonSize + buttonGap) * 4, width: buttonSize, height: buttonSize, assetKey: 'info_icon', visible: false },
        ];
        
        this._boundMouseMove = this.handleMouseMove.bind(this);
        this._boundCanvasClick = this.handleCanvasClick.bind(this);
        
        this.canvas.addEventListener('mousemove', this._boundMouseMove);
        this.canvas.addEventListener('click', this._boundCanvasClick);
        
        eventBus.subscribe('gameStarted', () => this.uiButtons.forEach(b => b.visible = true));
    }

    destroy() {
        this.canvas.removeEventListener('mousemove', this._boundMouseMove);
        this.canvas.removeEventListener('click', this._boundCanvasClick);
    }
    
    _getMousePos(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
      };
    }

    handleMouseMove(e) {
        const { x, y } = this._getMousePos(e);
        this.hoveredButton = null;
        for (const button of this.uiButtons) {
            if (button.visible && x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
                this.hoveredButton = button;
                break;
            }
        }
    }

    handleCanvasClick(e) {
        if (this.hoveredButton) {
            eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
            eventBus.publish('ui_button_clicked', { buttonId: this.hoveredButton.id });
        }
    }

    update() {}

    render(ctx, isRunning) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        for (const button of this.uiButtons) {
            if (!button.visible) continue;

            const assetKey = (button.id === 'pause') ? (isRunning ? 'pause_icon' : 'play_icon') : button.assetKey;
            const sprite = this.assets[assetKey];
            if (!sprite) continue;

            const isHovered = this.hoveredButton?.id === button.id;
            const scale = isHovered ? 1.1 : 1.0;
            const width = button.width * scale;
            const height = button.height * scale;
            const x = button.x - (width - button.width) / 2;
            const y = button.y - (height - button.height) / 2;
            
            ctx.globalAlpha = isHovered ? 1.0 : 0.8;
            ctx.drawImage(sprite, x, y, width, height);
        }
        ctx.restore();
    }
}