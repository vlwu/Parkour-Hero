import { GRID_CONSTANTS } from '../../utils/constants.js';
import { DOM } from '../ui/DOM.js';

export class GridInputHandler {
    constructor(context) {
        /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = context;
        this.gridContainer = DOM.gridContainer;
        this.grid = context.grid;

        this.lastHoveredIndex = -1;

        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleContextMenu = this._handleContextMenu.bind(this);

        this._addEventListeners();
    }

    _addEventListeners() {
        this.gridContainer.addEventListener('mousedown', this._handleMouseDown);
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
        this.gridContainer.addEventListener('contextmenu', this._handleContextMenu);
    }

    _handleContextMenu(e) {
        e.preventDefault();
        this.context.uiManager._onRightClick();
    }

    _getGridCoordsFromEvent(e) {
        const rect = this.gridContainer.getBoundingClientRect();
        const scale = this.grid.zoomLevel;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        const gridX = Math.floor(x / GRID_CONSTANTS.TILE_SIZE);
        const gridY = Math.floor(y / GRID_CONSTANTS.TILE_SIZE);
        const index = gridY * this.grid.width + gridX;
        return { pixelX: x, pixelY: y, gridX, gridY, index };
    }

    _handleMouseDown(e) {
        const coords = this._getGridCoordsFromEvent(e);
        this.context.toolManager.onMouseDown(e, coords);
    }

    _handleMouseMove(e) {
        const coords = this._getGridCoordsFromEvent(e);
        this.context.toolManager.onMouseMove(e, coords);

        // Hover logic is separate from tool logic
        if (coords.index !== this.lastHoveredIndex) {
            // This could also be a tool manager event if desired
            this._onHover(coords);
            this.lastHoveredIndex = coords.index;
        }
    }
    
    _onHover({ gridX, gridY }) {
        const { state, inputHandler } = this.context;
        if(state.currentTool.type === 'eraser' || state.currentTool.type === 'paste') {
            const pixelX = gridX * GRID_CONSTANTS.TILE_SIZE + GRID_CONSTANTS.TILE_SIZE / 2;
            const pixelY = gridY * GRID_CONSTANTS.TILE_SIZE + GRID_CONSTANTS.TILE_SIZE / 2;
            state.pastePreview = { pixelX, pixelY, gridX, gridY };
        } else {
            state.pastePreview = null;
        }

        const selection = state.selection;
        if (selection && gridX >= selection.x && gridX < selection.x + selection.width &&
            gridY >= selection.y && gridY < selection.y + selection.height) {
            inputHandler.setCursor('move');
        } else if (state.currentTool.type === 'select') {
            inputHandler.setCursor('crosshair');
        } else if (state.currentTool.type === 'eraser') {
            inputHandler.setCursor('none');
        } else {
            inputHandler.setCursor('crosshair');
        }
    }

    _handleMouseUp(e) {
        const coords = this._getGridCoordsFromEvent(e);
        this.context.toolManager.onMouseUp(e, coords);
    }

    setCursor(cursorStyle) {
        this.gridContainer.style.cursor = cursorStyle;
    }
}