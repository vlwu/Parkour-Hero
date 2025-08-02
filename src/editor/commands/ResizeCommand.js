import { Command } from './Command.js';

export class ResizeCommand extends Command {
    constructor(grid, objectManager, before, after) {
        super();
        this.grid = grid;
        this.objectManager = objectManager;
        this.before = before;
        this.after = after;
    }

    _applyState(state) {
        this.grid.width = state.width;
        this.grid.height = state.height;
        this.grid.tileData = [...state.tileData];
        this.grid.generate();

        this.objectManager.clear();
        this.objectManager.objects = JSON.parse(JSON.stringify(state.objects));
        this.objectManager.view.renderObjects(this.objectManager.objects);
    }

    execute() {
        this._applyState(this.after);
    }

    undo() {
        this._applyState(this.before);
    }
}