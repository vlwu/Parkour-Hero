import { Tool } from './Tool.js';
import { PaintCommand } from '../commands/PaintCommand.js';
import { DeleteObjectCommand } from '../commands/DeleteObjectCommand.js';
import { CompositeCommand } from '../commands/CompositeCommand.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';

export class EraserTool extends Tool {
    constructor(context) {
        super(context);
        this.isErasing = false;
        this.currentEraseAction = null;
    }

    activate() {
        this.context.inputHandler.setCursor('none');
    }

    deactivate() {
        this.state.pastePreview = null;
    }

    onMouseDown(e, coords) {
        if (e.button !== 0) return;
        this.isErasing = true;
        this.currentEraseAction = { tileChanges: [], deletedObjects: new Map() };
        this._erase(e, coords);
    }

    onMouseMove(e, coords) {
        this.onHover(e, coords); // Update cursor preview
        if (!this.isErasing) return;
        this._erase(e, coords);
    }

    onMouseUp() {
        if (!this.isErasing) return;
        this.isErasing = false;

        const { tileChanges, deletedObjects } = this.currentEraseAction;
        const composite = new CompositeCommand();

        if (tileChanges.length > 0) {
            composite.add(new PaintCommand(this.grid, tileChanges));
        }
        if (deletedObjects.size > 0) {
            deletedObjects.forEach(obj => {
                composite.add(new DeleteObjectCommand(this.objectManager, obj));
            });
        }

        if (composite.commands.length > 0) {
            this.history.push(composite);
        }
        this.currentEraseAction = null;
    }

    onHover(e, { gridX, gridY }) {
        this.state.pastePreview = { gridX, gridY };
    }

    _erase(e, { gridX, gridY }) {

        const brushRadius = Math.floor(this.state.eraserSize / 2);
        for (let y = -brushRadius; y <= brushRadius; y++) {
            for (let x = -brushRadius; x <= brushRadius; x++) {
                const currentX = gridX + x;
                const currentY = gridY + y;
                if (currentX >= 0 && currentX < this.grid.width && currentY >= 0 && currentY < this.grid.height) {
                    const index = currentY * this.grid.width + currentX;
                    const oldId = this.grid.getTileId(index);
                    if (oldId !== '0' && !this.currentEraseAction.tileChanges.some(c => c.index === index)) {
                        this.currentEraseAction.tileChanges.push({ index, from: oldId, to: '0' });
                        this.grid.paintCell(index, '0');
                    }
                }
            }
        }

        const objectTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dynamic-object');
        if (objectTarget) {
            const id = parseInt(objectTarget.dataset.id, 10);
            if (!this.currentEraseAction.deletedObjects.has(id)) {
                 const objectToDelete = this.objectManager.getObject(id);
                if (objectToDelete && objectToDelete.type !== 'player_spawn') {
                    this.currentEraseAction.deletedObjects.set(id, JSON.parse(JSON.stringify(objectToDelete)));
                    this.objectManager.deleteObject(id);
                }
            }
        }
    }
}