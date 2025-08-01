import { GRID_CONSTANTS } from '../../utils/constants.js';

export class GridInputHandler {
    constructor(gridContainer, grid, callbacks) {
        this.gridContainer = gridContainer;
        this.grid = grid;
        this.callbacks = callbacks;

        this.isPainting = false;
        this.isErasing = false;
        this.isDragging = false;
        this.isSelecting = false;
        this.isPasting = false;

        this.draggedObjectId = null;
        this.dragInitialX = 0;
        this.dragInitialY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.selectionStartCoords = null;
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
        this.callbacks.onRightClick();
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
        const { pixelX, pixelY, gridX, gridY } = this._getGridCoordsFromEvent(e);
        const objectTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dynamic-object');

        if (e.button === 0) {
            const tool = this.callbacks.getCurrentTool();

            if (objectTarget) {
                const id = parseInt(objectTarget.dataset.id, 10);
                if (tool === 'eraser') {
                    this.isErasing = true;
                    this.callbacks.onPaintStart();
                    this.callbacks.onEraseObject(id);
                } else if (tool === 'select') {
                    this.callbacks.onObjectSelect(id);
                    this._startDrag(e, objectTarget);
                } else {
                    this._startDrag(e, objectTarget);
                }
                return;
            }

            switch (tool) {
                case 'paint':
                    this.isPainting = true;
                    this.callbacks.onPaintStart();
                    this.callbacks.onPaint(gridX, gridY);
                    break;
                case 'place':
                    this.callbacks.onObjectPlace(pixelX, pixelY);
                    break;
                case 'eraser':
                    this.isErasing = true;
                    this.callbacks.onPaintStart();
                    this.callbacks.onErase(gridX, gridY);
                    break;
                case 'select':
                    this.isSelecting = true;
                    this.selectionStartCoords = { x: gridX, y: gridY };
                    this.callbacks.onSelectionChange(this.selectionStartCoords, this.selectionStartCoords);
                    break;
                case 'paste':
                    this.callbacks.onPaste(gridX, gridY);
                    break;
            }
        }
    }

    _startDrag(e, objectTarget) {
        const id = parseInt(objectTarget.dataset.id);
        this.isDragging = true;
        this.draggedObjectId = id;
        const { x, y } = this.callbacks.onObjectDragStart(id);
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragInitialX = x;
        this.dragInitialY = y;
        objectTarget.classList.add('dragging');
    }


    _handleMouseMove(e) {
        const { pixelX, pixelY, gridX, gridY, index } = this._getGridCoordsFromEvent(e);

        if (this.isDragging && this.draggedObjectId !== null) {
            const scale = this.grid.zoomLevel;
            const dx = (e.clientX - this.dragStartX) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const dy = (e.clientY - this.dragStartY) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const newX = this.dragInitialX + dx;
            const newY = this.dragInitialY + dy;
            this.callbacks.onObjectDrag(this.draggedObjectId, newX, newY);
        } else if (this.isPainting) {
            if (gridX < 0 || gridX >= this.grid.width || gridY < 0 || gridY >= this.grid.height) return;
            this.callbacks.onPaint(gridX, gridY);
        } else if (this.isErasing) {
            this.callbacks.onHover(gridX, gridY);
            const objectTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dynamic-object');
            if (objectTarget) {
                const id = parseInt(objectTarget.dataset.id, 10);
                this.callbacks.onEraseObject(id);
            } else {
                if (gridX < 0 || gridX >= this.grid.width || gridY < 0 || gridY >= this.grid.height) return;
                this.callbacks.onErase(gridX, gridY);
            }
        } else if (this.isSelecting) {
            this.callbacks.onSelectionChange(this.selectionStartCoords, { x: gridX, y: gridY });
        } else {
             if (index !== this.lastHoveredIndex) {
                this.callbacks.onHover(gridX, gridY);
                this.lastHoveredIndex = index;
            }
        }
    }

    _handleMouseUp(e) {
        if (this.isPainting || this.isErasing) this.callbacks.onPaintEnd();
        if (this.isDragging && this.draggedObjectId !== null) {
            document.querySelector('.dynamic-object.dragging')?.classList.remove('dragging');
            this.callbacks.onObjectDragEnd(this.draggedObjectId);
        }
        if (this.isSelecting) {
            const { gridX, gridY } = this._getGridCoordsFromEvent(e);
            this.callbacks.onSelectionEnd({ x: gridX, y: gridY });
        }

        this.isPainting = false;
        this.isErasing = false;
        this.isDragging = false;
        this.isSelecting = false;
        this.draggedObjectId = null;
        this.selectionStartCoords = null;
    }

    setCursor(cursorStyle) {
        this.gridContainer.style.cursor = cursorStyle;
    }
}