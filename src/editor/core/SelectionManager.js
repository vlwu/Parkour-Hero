import { GRID_CONSTANTS } from '../../utils/constants.js';
import { DOM } from '../ui/DOM.js';

export class SelectionManager {
    constructor(context) {
        /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = context;
        this.marchingAntsOffset = 0;
    }

    update(dt) {
        this.marchingAntsOffset = (this.marchingAntsOffset + dt * 50) % 10;
    }

    onSelectionChange(start, current) {
        const x1 = Math.min(start.x, current.x);
        const y1 = Math.min(start.y, current.y);
        const x2 = Math.max(start.x, current.x);
        const y2 = Math.max(start.y, current.y);
        this.context.state.selection = { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 };
        DOM.selectionActions.style.display = 'flex';
    }

    clearSelection() {
        this.context.state.selection = null;
        DOM.selectionActions.style.display = 'none';
    }

    draw() {
        if (!this.context.state.selection) return;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const ctx = this.context.grid.overlayCtx;
        const sel = this.context.state.selection;
        const x = sel.x * TILE_SIZE;
        const y = sel.y * TILE_SIZE;
        const width = sel.width * TILE_SIZE;
        const height = sel.height * TILE_SIZE;

        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -this.marchingAntsOffset;
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
    }
}
