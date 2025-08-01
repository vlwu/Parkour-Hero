import { Tool } from './Tool.js';
import { MoveObjectCommand } from '../commands/MoveObjectCommand.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';

const round = (val) => Math.round(val * 100) / 100;

export class SelectTool extends Tool {
    constructor(context) {
        super(context);
        this.isDragging = false;
        this.isSelecting = false;
        this.draggedObjectId = null;
        this.dragInitialX = 0;
        this.dragInitialY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.selectionStartCoords = null;
    }

    onMouseDown(e, { gridX, gridY }) {
        if (e.button !== 0) return;

        const objectTarget = e.target.closest('.dynamic-object');

        if (objectTarget) {
            const id = parseInt(objectTarget.dataset.id, 10);
            this.context.selectObject(id);
            this._startDrag(e, objectTarget);
        } else {
            this.context.deselectObject();
            this.isSelecting = true;
            this.selectionStartCoords = { x: gridX, y: gridY };
            this.context.onSelectionChange(this.selectionStartCoords, this.selectionStartCoords);
        }
    }

    onMouseMove(e, { gridX, gridY }) {
        if (this.isDragging && this.draggedObjectId !== null) {
            const scale = this.grid.zoomLevel;
            const dx = (e.clientX - this.dragStartX) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const dy = (e.clientY - this.dragStartY) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const newX = this.dragInitialX + dx;
            const newY = this.dragInitialY + dy;
            this.context.onObjectDrag(this.draggedObjectId, newX, newY);
        } else if (this.isSelecting) {
            this.context.onSelectionChange(this.selectionStartCoords, { x: gridX, y: gridY });
        }
    }

    onMouseUp(e, coords) {
        if (this.isDragging && this.draggedObjectId !== null) {
            document.querySelector('.dynamic-object.dragging')?.classList.remove('dragging');
            this._endDrag();
        }
        if (this.isSelecting) {
            this.context.onSelectionEnd();
        }
        this.isDragging = false;
        this.isSelecting = false;
        this.draggedObjectId = null;
    }

    _startDrag(e, objectTarget) {
        const id = parseInt(objectTarget.dataset.id);
        this.isDragging = true;
        this.draggedObjectId = id;
        
        const obj = this.objectManager.getObject(id);
        if (!obj) return;
        
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragInitialX = obj.x;
        this.dragInitialY = obj.y;
        
        objectTarget.classList.add('dragging');
    }

    _endDrag() {
        const id = this.draggedObjectId;
        const obj = this.objectManager.getObject(id);
        if (!obj) return;

        this.objectManager._applySnapping(obj);
        this.objectManager._updateGroundedEnemyBehavior(obj);

        const finalX = round(obj.x);
        const finalY = round(obj.y);
        const initial = { x: this.dragInitialX, y: this.dragInitialY };

        if (initial.x !== finalX || initial.y !== finalY) {
            this.history.push(new MoveObjectCommand(this.objectManager, id, initial, { x: finalX, y: finalY }));
        }

        obj.x = finalX;
        obj.y = finalY;
        this.objectManager.render();
        this.context.propertiesPanel.displayObject(obj);
    }
}