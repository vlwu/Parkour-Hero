import { TILE_DEFINITIONS } from '../../entities/tile-definitions.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';
import { getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from '../ui/DOM.js';

// IMPORTANT: Replace these values with the actual dimensions of your Terrain.png file
// I will assume 256x256 based on the last step.
const TERRAIN_SPRITESHEET_WIDTH = 256;
const TERRAIN_SPRITESHEET_HEIGHT = 256;

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
        if (!cell) return;

        cell.dataset.tileId = tileId;
        const def = TILE_DEFINITIONS[tileId];

        // --- NEW STRATEGY ---
        // 1. Reset the grid cell completely
        cell.innerHTML = ''; // Clear any previous inner span
        cell.style.backgroundColor = 'transparent';
        cell.style.borderTop = '';

        if (!def || def.type === 'empty') {
            return; // Cell is empty
        }

        // 2. Decide how to render based on tile type
        if (def.collisionBox) {
            // It's a fractional block. Create an inner element to hold the sprite.
            const innerBlock = document.createElement('span');
            innerBlock.style.display = 'block'; // Make it behave like a div
            innerBlock.style.width = `${def.collisionBox.width}px`;
            innerBlock.style.height = `${def.collisionBox.height}px`;
            innerBlock.style.backgroundImage = `url('/assets/Terrain/Terrain.png')`;
            innerBlock.style.backgroundPosition = `-${def.spriteConfig.srcX}px -${def.spriteConfig.srcY}px`;
            innerBlock.style.backgroundSize = `${TERRAIN_SPRITESHEET_WIDTH}px ${TERRAIN_SPRITESHEET_HEIGHT}px`;
            innerBlock.style.backgroundRepeat = 'no-repeat';
            cell.appendChild(innerBlock);
        } else if (!def.oneWay) {
            // It's a standard, full-sized block. Fill the cell's background.
            cell.style.backgroundColor = getPaletteColor(def.type);
        }

        // 3. If it's a one-way platform, add the top border to the main cell
        if (def.oneWay) {
            cell.style.borderTop = `5px solid ${getPaletteColor(def.type)}`;
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