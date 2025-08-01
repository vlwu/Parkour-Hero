import { Tool } from './Tool.js';
import { PaintCommand } from '../commands/PaintCommand.js';

export class PaintTool extends Tool {
    constructor(context) {
        super(context);
        this.isPainting = false;
        this.currentPaintAction = [];
    }

    onMouseDown(e, { gridX, gridY }) {
        if (e.button !== 0) return;
        this.isPainting = true;
        this.currentPaintAction = [];
        this._paint(gridX, gridY);
    }

    onMouseMove(e, { gridX, gridY }) {
        if (!this.isPainting) return;
        this._paint(gridX, gridY);
    }

    onMouseUp() {
        if (!this.isPainting) return;
        this.isPainting = false;
        if (this.currentPaintAction.length > 0) {
            this.history.push(new PaintCommand(this.grid, this.currentPaintAction));
        }
        this.currentPaintAction = [];
    }

    _paint(gridX, gridY) {
        const tileId = this.state.currentTool.id;
        const index = gridY * this.grid.width + gridX;
        
        if (index < 0 || index >= this.grid.tileData.length) return;

        const oldId = this.grid.getTileId(index);
        if (oldId !== tileId && !this.currentPaintAction.some(c => c.index === index)) {
            this.currentPaintAction.push({ index, from: oldId, to: tileId });
            this.grid.paintCell(index, tileId);
        }
    }
}