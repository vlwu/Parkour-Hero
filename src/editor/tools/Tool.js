export class Tool {
    constructor(editorContext) {
        if (this.constructor === Tool) {
            throw new Error("Abstract classes can't be instantiated.");
        }

        this.context = editorContext;
    }

    onMouseDown(e, coords) {}
    onMouseMove(e, coords) {}
    onMouseUp(e, coords) {}
    onHover(e, coords) {}
    activate() {}
    deactivate() {}
    drawPreview(dt) {}

    get grid() { return this.context.grid; }
    get state() { return this.context.state; }
    get objectManager() { return this.context.objectManager; }
    get history() { return this.context.history; }
}