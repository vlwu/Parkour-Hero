import { DOM } from './DOM.js';

export class UIManager {
    constructor(context) {
         /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = context;
    }

    init() {
        this.context.palette.populate();
        this._setupResizeModalListeners();
    }
    
    selectObject(id) {
        const obj = this.context.objectManager.getObject(id);
        if (!obj) return;
        this.deselectObject();
        this.context.state.selectedObject = obj;
        this.context.propertiesPanel.displayObject(obj);
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${obj.id}']`)?.classList.add('selected');
    }
    
    deselectObject() {
        const { state, propertiesPanel } = this.context;
        if (!state.selectedObject) return;
        
        const el = DOM.gridContainer.querySelector(`.dynamic-object[data-id='${state.selectedObject.id}']`);
        el?.classList.remove('selected');
        
        state.selectedObject = null;
        propertiesPanel.clear();
    }
    
    _onRightClick() {
        const { state, palette, propertiesPanel, selectionManager, inputHandler } = this.context;
        if (state.selection || state.currentTool.type === 'paste') {
            selectionManager.clearSelection();
            state.pastePreview = null;
            state.clipboard = null;
            palette.selectTool('select');
        } else {
            state.currentTool = { type: 'none' };
            palette.updateSelectionVisuals();
            propertiesPanel.clear();
            inputHandler.setCursor('default');
        }
    }
    
    _setupResizeModalListeners() {
        DOM.cancelResizeBtn.addEventListener('click', () => {
            DOM.resizeModalOverlay.style.display = 'none';
        });

        DOM.confirmResizeBtn.addEventListener('click', () => {
            const newWidth = parseInt(DOM.newWidthInput.value);
            const newHeight = parseInt(DOM.newHeightInput.value);
            const anchor = DOM.anchorGrid.querySelector('.selected').dataset.anchor;

            if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
                alert("Please enter valid positive numbers for width and height.");
                return;
            }
            this.context.app._performResize(newWidth, newHeight, anchor);
            DOM.resizeModalOverlay.style.display = 'none';
        });

        DOM.anchorGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('anchor-point')) {
                DOM.anchorGrid.querySelector('.selected').classList.remove('selected');
                e.target.classList.add('selected');
            }
        });
    }
}