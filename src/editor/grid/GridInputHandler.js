// src/editor/grid/GridInputHandler.js

import { GRID_CONSTANTS } from '../../utils/constants.js';

export class GridInputHandler {
    constructor(gridContainer, grid, callbacks) {
        this.gridContainer = gridContainer;
        this.grid = grid; // Reference to the grid module for zoomLevel/dimensions
        this.callbacks = callbacks;

        this.isPainting = false;
        this.isErasing = false;
        this.isDragging = false;
        
        this.draggedObjectId = null;
        this.dragInitialX = 0;
        this.dragInitialY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;

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
    }

    _handleMouseDown(e) {
        const target = e.target;
        const rect = this.gridContainer.getBoundingClientRect();
        const scale = this.grid.zoomLevel; // Use the current zoom level
        
        const clickX = (e.clientX - rect.left) / scale;
        const clickY = (e.clientY - rect.top) / scale;

        const cellTarget = target.closest('.grid-cell');
        const objectTarget = target.closest('.dynamic-object');

        if (objectTarget) { // Prioritize actions on dynamic objects over the grid cell
            const id = parseInt(objectTarget.dataset.id);
            if (e.button === 0) { // Left-click drag
                this.isDragging = true;
                this.draggedObjectId = id;
                const {x, y} = this.callbacks.onObjectDragStart(id);
                
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragInitialX = x;
                this.dragInitialY = y;
                objectTarget.classList.add('dragging');
            } else if (e.button === 2) { // Right-click delete
                this.callbacks.onObjectDelete(id);
            }
        } else if (cellTarget) { // If not an object, check if it was a cell (or a child of a cell)
            const index = parseInt(cellTarget.dataset.index);
            if (e.button === 0) { // Left-click
                if (this.callbacks.isTileSelected()) {
                    this.isPainting = true;
                    this.callbacks.onPaintStart();
                    this.callbacks.onPaint(index);
                } else {
                    this.callbacks.onObjectPlace(clickX, clickY);
                }
            } else if (e.button === 2) { // Right-click
                this.isErasing = true;
                this.callbacks.onPaintStart();
                this.callbacks.onErase(index);
            }
        }
    }

    _handleMouseMove(e) {
        if (this.isDragging && this.draggedObjectId !== null) {
            const scale = this.grid.zoomLevel; // Use the current zoom level
            const dx = (e.clientX - this.dragStartX) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const dy = (e.clientY - this.dragStartY) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const newX = this.dragInitialX + dx;
            const newY = this.dragInitialY + dy;
            this.callbacks.onObjectDrag(this.draggedObjectId, newX, newY);
        } else if (this.isPainting || this.isErasing) {
            const cellTarget = e.target.closest('.grid-cell');
            if (cellTarget) {
                const index = parseInt(cellTarget.dataset.index);
                if (this.isErasing) {
                    this.callbacks.onErase(index);
                } else {
                    this.callbacks.onPaint(index);
                }
            }
        }
    }

    _handleMouseUp(e) {
        if (this.isPainting || this.isErasing) {
            this.callbacks.onPaintEnd();
        }

        if (this.isDragging && this.draggedObjectId !== null) {
            document.querySelector('.dynamic-object.dragging')?.classList.remove('dragging');
            this.callbacks.onObjectDragEnd(this.draggedObjectId);
        }

        this.isPainting = false;
        this.isErasing = false;
        this.isDragging = false;
        this.draggedObjectId = null;
    }
}