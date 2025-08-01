export class Tool {
    constructor(editorContext) {
        if (this.constructor === Tool) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = editorContext;
    }

    onMouseDown(e, coords) {}
    onMouseMove(e, coords) {}
    onMouseUp(e, coords) {}
    onHover(coords) {}
    activate() {}
    deactivate() {}

    get grid() { return this.context.grid; }
    get state() { return this.context.state; }
    get objectManager() { return this.context.objectManager; }
    get history() { return this.context.history; }
}