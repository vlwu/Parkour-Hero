import { DOM } from './DOM.js';

export class Toolbar {
    static setup(callbacks) {
        DOM.newBtn.addEventListener('click', callbacks.onNew);
        DOM.resizeBtn.addEventListener('click', callbacks.onResize);
        DOM.loadBtn.addEventListener('click', () => DOM.loadFileInput.click());
        DOM.exportBtn.addEventListener('click', callbacks.onExport);

        DOM.undoBtn.addEventListener('click', callbacks.onUndo);
        DOM.redoBtn.addEventListener('click', callbacks.onRedo);

        DOM.loadFileInput.addEventListener('change', (e) => {
            callbacks.onFileLoad(e);
            e.target.value = null; // Reset file input
        });
    }
}