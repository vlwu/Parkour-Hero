export class KeyboardManager {
    constructor(context) {
        /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = context;
        this._boundKeyDown = this._handleKeyDown.bind(this);
    }

    init() {
        window.addEventListener('keydown', this._boundKeyDown);
    }

    destroy() {
        window.removeEventListener('keydown', this._boundKeyDown);
    }

    _handleKeyDown(e) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
            return;
        }

        const { history, clipboardManager, palette, uiManager } = this.context;

        // Undo/Redo
        if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); history.undo(); }
        if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); history.redo(); }

        // Clipboard
        if (e.ctrlKey && e.key.toLowerCase() === 'c') { e.preventDefault(); clipboardManager.handleSelectionAction('copy'); }
        if (e.ctrlKey && e.key.toLowerCase() === 'x') { e.preventDefault(); clipboardManager.handleSelectionAction('cut'); }
        if (e.ctrlKey && e.key.toLowerCase() === 'v') { e.preventDefault(); clipboardManager.preparePaste(); }
        
        // Delete
        if (e.key === 'Delete') { e.preventDefault(); clipboardManager.handleSelectionAction('delete'); }
        
        // Tool Shortcuts
        if (!e.ctrlKey && e.key.toLowerCase() === 'e') { e.preventDefault(); palette.selectTool('eraser'); }
        if (!e.ctrlKey && e.key.toLowerCase() === 'v') { e.preventDefault(); palette.selectTool('select'); }
        
        // Escape / Deselect
        if (e.key === 'Escape') { e.preventDefault(); uiManager._onRightClick(); }
    }
}