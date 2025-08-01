import { GRID_CONSTANTS } from '../../utils/constants.js';

export class GridInputHandler {
    constructor(gridContainer, grid, toolManager, uiManager) {
        this.gridContainer = gridContainer;
        this.grid = grid;
        this.toolManager = toolManager;
        this.uiManager = uiManager; // Added UIManager reference

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
        this.uiManager._onRightClick();
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
        this.toolManager.onMouseDown(e, coords);
    }

    _handleMouseMove(e) {
        const coords = this._getGridCoordsFromEvent(e);
        this.toolManager.onMouseMove(e, coords);

        // Hover logic is separate from tool logic
        if (coords.index !== this.lastHoveredIndex) {
            this.toolManager.onHover(coords);
            this.lastHoveredIndex = coords.index;
        }
    }

    _handleMouseUp(e) {
        const coords = this._getGridCoordsFromEvent(e);
        this.toolManager.onMouseUp(e, coords);
    }

    setCursor(cursorStyle) {
        this.gridContainer.style.cursor = cursorStyle;
    }
}