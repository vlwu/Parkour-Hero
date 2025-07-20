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
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        eventBus.subscribe('gameStarted', () => this.uiButtons.forEach(b => b.visible = true));
        eventBus.subscribe('gamePaused', () => {}); // Can be used to update UI state if needed
        eventBus.subscribe('gameResumed', () => {});
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
        const { x, y } = this._getMousePos(e);
        let clickedButton = null;
        for (const button of this.uiButtons) {
            if (button.visible && x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
                clickedButton = button;
                break;
            }
        }
        if (clickedButton) {
            eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
            eventBus.publish('ui_button_clicked', { buttonId: clickedButton.id });
        }
    }

    update(dt, context) {
        // The UISystem's update is currently driven by events, but this is here for future use
        // and to conform to the engine's new update loop.
    }

    render(ctx, isRunning) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        for (const button of this.uiButtons) {
            if (!button.visible) continue;

            let assetKey;
            if (button.id === 'pause') {
                assetKey = isRunning ? 'pause_icon' : 'play_icon';
            } else {
                assetKey = button.assetKey;
            }

            const sprite = this.assets[assetKey];
            if (!sprite) continue;

            let x = button.x;
            let y = button.y;
            let width = button.width;
            let height = button.height;

            const isHovered = this.hoveredButton && this.hoveredButton.id === button.id;
            
            if (isHovered) {
                const scale = 1.1;
                width *= scale;
                height *= scale;
                x -= (width - button.width) / 2;
                y -= (height - button.height) / 2;
            }
            
            ctx.globalAlpha = isHovered ? 1.0 : 0.8;

            ctx.drawImage(sprite, x, y, width, height);
        }
        ctx.restore();
    }
}