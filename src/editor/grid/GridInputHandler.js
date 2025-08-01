import { GRID_CONSTANTS } from '../../utils/constants.js';

export class GridInputHandler {
    constructor(context) {

        this.context = context;
        this.gridContainer = null;
        this.grid = context.grid;

        this.lastHoveredIndex = -1;


        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleContextMenu = this._handleContextMenu.bind(this);
    }

    init() {

        this.gridContainer = this.grid.tileCanvas.parentElement;
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
        const objectTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dynamic-object');
        if (objectTarget && e.button === 0) {
            if (this.context.state.currentTool.type !== 'select' && this.context.state.currentTool.type !== 'eraser') {
                this.context.palette.selectTool('select');
            }
        }

        const coords = this._getGridCoordsFromEvent(e);
        this.context.toolManager.onMouseDown(e, coords);
    }

    _handleMouseMove(e) {
        const coords = this._getGridCoordsFromEvent(e);
        this.context.toolManager.onMouseMove(e, coords);

        if (coords.index !== this.lastHoveredIndex) {
            this.context.toolManager.onHover(e, coords);
            this.lastHoveredIndex = coords.index;
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