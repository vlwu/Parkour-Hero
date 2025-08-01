export class EditorState {
    constructor() {
        this.currentTool = { type: 'paint', id: '1' };
        this.selectedObject = null;
        this.eraserSize = 1;
        this.selection = null;
        this.clipboard = null;
        this.pastePreview = null;
        
        // Properties for moving a selection
        this.isDraggingSelection = false;
        this.selectionDragPreview = { deltaX: 0, deltaY: 0 };
        this.selectionSnapshot = null;
    }
}