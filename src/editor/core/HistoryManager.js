export class HistoryManager {
    constructor(undoBtn, redoBtn) {
        this.historyStack = [];
        this.redoStack = [];
        this.undoBtn = undoBtn;
        this.redoBtn = redoBtn;
        this.updateButtons();
    }

    push(command) {
        this.historyStack.push(command);
        this.redoStack = [];
        this.updateButtons();
    }

    undo() {
        if (this.historyStack.length === 0) return;
        const command = this.historyStack.pop();
        command.undo();
        this.redoStack.push(command);
        this.updateButtons();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const command = this.redoStack.pop();
        command.execute();
        this.historyStack.push(command);
        this.updateButtons();
    }

    clear() {
        this.historyStack = [];
        this.redoStack = [];
        this.updateButtons();
    }

    updateButtons() {
        this.undoBtn.disabled = this.historyStack.length === 0;
        this.redoBtn.disabled = this.redoStack.length === 0;
    }
}