export class HistoryManager {
    constructor(undoBtn, redoBtn) {
        this.historyStack = [];
        this.redoStack = [];
        this.undoBtn = undoBtn;
        this.redoBtn = redoBtn;
        this.updateButtons();
    }

    push(action) {
        // Using structuredClone is a modern way to deep-copy objects
        this.historyStack.push(structuredClone(action));
        this.redoStack = [];
        this.updateButtons();
    }

    undo() {
        if (this.historyStack.length === 0) return null;
        const action = this.historyStack.pop();
        this.redoStack.push(structuredClone(action));
        this.updateButtons();
        return action; // Return the action for the orchestrator to execute
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();
        this.historyStack.push(structuredClone(action));
        this.updateButtons();
        return action; // Return the action for the orchestrator to execute
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