import { Tool } from './Tool.js';
import { MoveObjectCommand } from '../commands/MoveObjectCommand.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';
import { CompositeCommand } from '../commands/CompositeCommand.js';
import { PaintCommand } from '../commands/PaintCommand.js';
import { getPaletteColor } from '../config/EditorSettings.js';

const round = (val) => Math.round(val * 100) / 100;

export class SelectTool extends Tool {
    constructor(context) {
        super(context);
        this.isDraggingObject = false;
        this.isCreatingSelection = false;
        this.draggedObjectId = null;
        this.objectDragStartPosition = null;
        this.dragStartClientX = 0;
        this.dragStartClientY = 0;
        this.selectionStartCoords = null;
    }

    activate() {
        this.context.inputHandler.setCursor('crosshair');
    }

    onMouseDown(e, coords) {
        if (e.button !== 0) return;

        const selection = this.context.state.selection;
        const isClickInSelection = selection &&
            coords.gridX >= selection.x && coords.gridX < selection.x + selection.width &&
            coords.gridY >= selection.y && coords.gridY < selection.y + selection.height;

        if (e.shiftKey && selection && isClickInSelection) {
            this._startMoveSelection(e);
            return;
        }

        const objectTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dynamic-object');

        if (objectTarget) {
            const id = parseInt(objectTarget.dataset.id, 10);
            this.context.app.selectObject(id);
            this._startDrag(e, objectTarget);
            this.isDraggingObject = true;
        } else {
            this.context.app.deselectObject();
            this.isCreatingSelection = true;
            this.selectionStartCoords = { x: coords.gridX, y: coords.gridY };
            this.context.selectionManager.onSelectionChange(this.selectionStartCoords, this.selectionStartCoords);
        }
    }

    onMouseMove(e, coords) {
        if (this.context.state.isDraggingSelection) {
            this._updateMoveSelection(e);
            return;
        }

        if (this.isDraggingObject && this.draggedObjectId !== null) {
            const scale = this.grid.zoomLevel;
            const dx = (e.clientX - this.dragStartClientX) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const dy = (e.clientY - this.dragStartClientY) / (GRID_CONSTANTS.TILE_SIZE * scale);
            const newX = this.objectDragStartPosition.x + dx;
            const newY = this.objectDragStartPosition.y + dy;
            this.context.app._onObjectDrag(this.draggedObjectId, newX, newY);
        } else if (this.isCreatingSelection) {
            this.context.selectionManager.onSelectionChange(this.selectionStartCoords, { x: coords.gridX, y: coords.gridY });
        }
    }

    onMouseUp() {
        if (this.context.state.isDraggingSelection) {
            this._endMoveSelection();
            return;
        }
        if (this.isDraggingObject && this.draggedObjectId !== null) {
            document.querySelector('.dynamic-object.dragging')?.classList.remove('dragging');
            this._endDrag();
        }
        if (this.isCreatingSelection) {
            this.context.selectionManager.onSelectionEnd();
        }
        this.isDraggingObject = false;
        this.isCreatingSelection = false;
        this.draggedObjectId = null;
    }

    onHover(e, { gridX, gridY }) {
        const hoveredObject = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dynamic-object');
        const selection = this.context.state.selection;
        const isOverSelection = selection && gridX >= selection.x && gridX < selection.x + selection.width && gridY >= selection.y && gridY < selection.y + selection.height;

        if (hoveredObject || isOverSelection) {
            this.context.inputHandler.setCursor('move');
        } else {
            this.context.inputHandler.setCursor('crosshair');
        }
    }

    drawPreview() {
        const { state, grid } = this.context;
        if (!state.isDraggingSelection || !state.selectionSnapshot) return;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const ctx = grid.overlayCtx;
        const { deltaX, deltaY } = state.selectionDragPreview;
        const snapshot = state.selectionSnapshot;

        const startPixelX = (snapshot.startX + deltaX) * TILE_SIZE;
        const startPixelY = (snapshot.startY + deltaY) * TILE_SIZE;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
        ctx.fillRect(startPixelX, startPixelY, snapshot.width * TILE_SIZE, snapshot.height * TILE_SIZE);
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.strokeRect(startPixelX, startPixelY, snapshot.width * TILE_SIZE, snapshot.height * TILE_SIZE);

        snapshot.objects.forEach(obj => {
            const newX = (snapshot.startX + obj.relativeX + deltaX);
            const newY = (snapshot.startY + obj.relativeY + deltaY);
            ctx.fillStyle = getPaletteColor(obj.type);
            ctx.fillRect(
                newX * TILE_SIZE - (obj.width / 2),
                newY * TILE_SIZE - (obj.height / 2),
                obj.width,
                obj.height
            );
        });

        ctx.globalAlpha = 1.0;
    }

    _startDrag(e, objectTarget) {
        const id = parseInt(objectTarget.dataset.id);
        this.isDraggingObject = true;
        this.draggedObjectId = id;

        const obj = this.objectManager.getObject(id);
        if (!obj) return;

        this.dragStartClientX = e.clientX;
        this.dragStartClientY = e.clientY;
        this.objectDragStartPosition = { x: obj.x, y: obj.y };

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
        const initial = this.objectDragStartPosition;

        if (initial && (initial.x !== finalX || initial.y !== finalY)) {
            this.history.push(new MoveObjectCommand(this.objectManager, id, initial, { x: finalX, y: finalY }));
        }

        obj.x = finalX;
        obj.y = finalY;
        this.objectManager.view.renderObjects(this.objectManager.getAllObjects());
        this.context.propertiesPanel.displayObject(obj);
    }

    _startMoveSelection(e) {
        const { state, grid, objectManager } = this.context;
        state.isDraggingSelection = true;
        this.dragStartClientX = e.clientX;
        this.dragStartClientY = e.clientY;

        const sel = state.selection;
        const snapshot = {
            tiles: [],
            objects: [],
            startX: sel.x,
            startY: sel.y,
            width: sel.width,
            height: sel.height
        };

        for (let y = 0; y < sel.height; y++) {
            for (let x = 0; x < sel.width; x++) {
                const index = (sel.y + y) * grid.width + (sel.x + x);
                const tileId = grid.getTileId(index);
                snapshot.tiles.push({ x, y, id: tileId });
            }
        }

        snapshot.objects = objectManager.getAllObjects()
            .filter(obj => {
                const objGridX = obj.x;
                const objGridY = obj.y;
                return objGridX >= sel.x && objGridX < sel.x + sel.width &&
                       objGridY >= sel.y && objGridY < sel.y + sel.height;
            })
            .map(obj => ({
                ...JSON.parse(JSON.stringify(obj)),
                relativeX: obj.x - sel.x,
                relativeY: obj.y - sel.y
            }));

        state.selectionSnapshot = snapshot;
    }

    _updateMoveSelection(e) {
        const { state, grid } = this.context;
        if (!state.isDraggingSelection) return;

        const scale = grid.zoomLevel;
        const deltaX = Math.round((e.clientX - this.dragStartClientX) / (GRID_CONSTANTS.TILE_SIZE * scale));
        const deltaY = Math.round((e.clientY - this.dragStartClientY) / (GRID_CONSTANTS.TILE_SIZE * scale));

        state.selectionDragPreview = { deltaX, deltaY };
    }

    _endMoveSelection() {
        const { state, grid, objectManager, history } = this.context;
        if (!state.isDraggingSelection) return;

        const { deltaX, deltaY } = state.selectionDragPreview;
        const snapshot = state.selectionSnapshot;

        if (snapshot && (deltaX !== 0 || deltaY !== 0)) {
            const composite = new CompositeCommand();

            const eraseChanges = [];
            snapshot.tiles.forEach(tile => {
                const oldX = snapshot.startX + tile.x;
                const oldY = snapshot.startY + tile.y;
                const index = oldY * grid.width + oldX;
                if (tile.id !== '0') {
                    eraseChanges.push({ index, from: tile.id, to: '0' });
                }
            });
            if(eraseChanges.length > 0) {
                composite.add(new PaintCommand(grid, eraseChanges));
            }

            const paintChanges = [];
            snapshot.tiles.forEach(tile => {
                if (tile.id === '0') return;
                const newX = snapshot.startX + tile.x + deltaX;
                const newY = snapshot.startY + tile.y + deltaY;
                if (newX >= 0 && newX < grid.width && newY >= 0 && newY < grid.height) {
                    const index = newY * grid.width + newX;
                    const oldId = grid.getTileId(index);
                    paintChanges.push({ index, from: oldId, to: tile.id });
                }
            });
            if(paintChanges.length > 0) {
                composite.add(new PaintCommand(grid, paintChanges));
            }

            snapshot.objects.forEach(obj => {
                const newPos = {
                    x: round(snapshot.startX + obj.relativeX + deltaX),
                    y: round(snapshot.startY + obj.relativeY + deltaY)
                };
                const fromPos = { x: obj.x, y: obj.y };
                composite.add(new MoveObjectCommand(objectManager, obj.id, fromPos, newPos));
            });

            composite.execute();
            history.push(composite);

            state.selection.x += deltaX;
            state.selection.y += deltaY;
        }

        state.isDraggingSelection = false;
        state.selectionSnapshot = null;
        state.selectionDragPreview = { deltaX: 0, deltaY: 0 };
        this.context.objectManager.view.renderObjects(this.context.objectManager.getAllObjects());
    }
}