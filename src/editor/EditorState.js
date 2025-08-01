export class EditorState {
    constructor() {
        this.currentTool = { type: 'paint', id: '1' };
        this.selectedObject = null;
        this.eraserSize = 1;
        this.selection = null;
        this.clipboard = null;
        this.pastePreview = null;
    }
}