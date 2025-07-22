import { TILE_DEFINITIONS } from '../../entities/tile-definitions.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';
import { getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from '../ui/DOM.js';

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.zoomLevel = 1;
    }

    generate() {
        DOM.gridContainer.innerHTML = '';
        DOM.gridContainer.style.gridTemplateColumns = `repeat(${this.width}, ${GRID_CONSTANTS.TILE_SIZE}px)`;
        DOM.gridContainer.style.width = `${this.width * GRID_CONSTANTS.TILE_SIZE}px`;
        DOM.gridContainer.style.height = `${this.height * GRID_CONSTANTS.TILE_SIZE}px`;

        for (let i = 0; i < this.width * this.height; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.tileId = '0'; // '0' represents an empty tile
            cell.dataset.index = i;
            DOM.gridContainer.appendChild(cell);
        }
        this.autoFitScale();
    }

    resize(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        this.generate();
    }

    autoFitScale() {
        const availableWidth = DOM.gridParent.clientWidth - 40;
        const availableHeight = DOM.gridParent.clientHeight - 40;
        const gridPixelWidth = this.width * GRID_CONSTANTS.TILE_SIZE;
        const gridPixelHeight = this.height * GRID_CONSTANTS.TILE_SIZE;

        const scaleX = availableWidth / gridPixelWidth;
        const scaleY = availableHeight / gridPixelHeight;

        this.setZoom(Math.min(scaleX, scaleY));
    }

    setZoom(level) {
        // Clamp zoom level to prevent zooming too far in or out
        this.zoomLevel = Math.max(0.1, Math.min(level, 3));
        this.applyZoom();
    }

    zoom(delta) {
        this.setZoom(this.zoomLevel + delta);
    }

    applyZoom() {
        DOM.gridContainer.style.transform = `scale(${this.zoomLevel})`;
    }

    paintCell(index, tileId) {
        const cell = DOM.gridContainer.children[index];
        if (cell) {
            cell.dataset.tileId = tileId;
            const def = TILE_DEFINITIONS[tileId];
            cell.style.backgroundColor = getPaletteColor(def.type);
        }
    }

    getTileId(index) {
        return DOM.gridContainer.children[index]?.dataset.tileId || '0';
    }

    isTileSolid(gridX, gridY) {
        const x = Math.floor(gridX);
        const y = Math.floor(gridY);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        const index = y * this.width + x;
        const tileId = this.getTileId(index);
        const tileDef = TILE_DEFINITIONS[tileId];
        return tileDef?.solid || false;
    }

    getLayout() {
        const layout = [];
        let rowString = '';
        for (let i = 0; i < DOM.gridContainer.children.length; i++) {
            rowString += this.getTileId(i);
            if ((i + 1) % this.width === 0) {
                layout.push(rowString);
                rowString = '';
            }
        }
        return layout;
    }
}