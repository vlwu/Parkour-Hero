import { Command } from './Command.js';

export class PaintCommand extends Command {
    constructor(grid, changes) {
        super();
        this.grid = grid;
        this.changes = changes; // Array of { index, from, to }
    }

    execute() {
        this.changes.forEach(c => this.grid.paintCell(c.index, c.to));
    }

    undo() {
        this.changes.forEach(c => this.grid.paintCell(c.index, c.from));
    }
}