import { Command } from './Command.js';

export class CompositeCommand extends Command {
    constructor(commands = []) {
        super();
        this.commands = commands;
    }

    add(command) {
        this.commands.push(command);
    }

    execute() {
        for (const command of this.commands) {
            command.execute();
        }
    }

    undo() {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}