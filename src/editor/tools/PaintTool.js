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
        const tool = this.state.currentTool;

        if (tool.type !== 'paint' || !tool.selection) {
            return;
        }

        const selection = tool.selection;
        for (let y = 0; y < selection.height; y++) {
            for (let x = 0; x < selection.width; x++) {
                const destX = gridX + x;
                const destY = gridY + y;
                const index = destY * this.grid.width + destX;

                if (destX < 0 || destX >= this.grid.width || destY < 0 || destY >= this.grid.height) {
                    continue;
                }

                const tileId = selection.ids[y * selection.width + x];
                if (tileId === '0') continue;

                const oldId = this.grid.getTileId(index);
                if (oldId !== tileId && !this.currentPaintAction.some(c => c.index === index)) {
                    this.currentPaintAction.push({ index, from: oldId, to: tileId });
                    this.grid.paintCell(index, tileId);
                }
            }
        }
    }
}