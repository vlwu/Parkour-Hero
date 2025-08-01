import { PaintTool } from './PaintTool.js';
import { EraserTool } from './EraserTool.js';
import { PlaceObjectTool } from './PlaceObjectTool.js';
import { SelectTool } from './SelectTool.js';
import { PasteTool } from './PasteTool.js';

export class ToolManager {
    constructor(editorContext) {
        /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = editorContext;
        this.tools = {
            'paint': new PaintTool(this.context),
            'eraser': new EraserTool(this.context),
            'place': new PlaceObjectTool(this.context),
            'select': new SelectTool(this.context),
            'paste': new PasteTool(this.context),
        };
        this.activeTool = null;
    }

    setActiveTool(toolName) {
        if (this.activeTool) {
            this.activeTool.deactivate();
        }

        let toolKey;
        if (toolName === 'paint' || toolName === 'place') {
            toolKey = toolName;
        } else if (this.tools[toolName]) {
            toolKey = toolName;
        } else {
            toolKey = null;
        }
        
        this.activeTool = this.tools[toolKey] || null;

        if (this.activeTool) {
            this.activeTool.activate();
        }
    }

    onMouseDown(e, coords) { this.activeTool?.onMouseDown(e, coords); }
    onMouseMove(e, coords) { this.activeTool?.onMouseMove(e, coords); }
    onMouseUp(e, coords) { this.activeTool?.onMouseUp(e, coords); }
    onHover(coords) { this.activeTool?.onHover(coords); }
}