import { TILE_DEFINITIONS } from '../../entities/tile-definitions.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';
import { getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from '../ui/DOM.js';

const TERRAIN_SPRITESHEET_WIDTH = 352;
const TERRAIN_SPRITESHEET_HEIGHT = 176;

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

        // 1. Reset cell style
        cell.innerHTML = '';
        cell.style.backgroundColor = 'transparent';
        cell.style.borderTop = '';
        cell.style.backgroundImage = 'none';

        if (!def || def.type === 'empty') {
            return; // Cell is empty
        }
        
        // 2. Handle rendering
        if (def.collisionBox) {
            // --- FIX START: Use a robust viewport/mover technique for accurate sprite clipping ---
            const viewport = document.createElement('span');
            viewport.style.display = 'block';
            viewport.style.width = `${def.collisionBox.width}px`;
            viewport.style.height = `${def.collisionBox.height}px`;
            viewport.style.overflow = 'hidden';
            viewport.style.position = 'relative';

            const spriteMover = document.createElement('span');
            spriteMover.style.display = 'block';
            spriteMover.style.position = 'absolute';
            spriteMover.style.width = `${TERRAIN_SPRITESHEET_WIDTH}px`;
            spriteMover.style.height = `${TERRAIN_SPRITESHEET_HEIGHT}px`;
            spriteMover.style.backgroundImage = `url('/assets/Terrain/Terrain.png')`;
            spriteMover.style.left = `-${def.spriteConfig.srcX}px`;
            spriteMover.style.top = `-${def.spriteConfig.srcY}px`;

            viewport.appendChild(spriteMover);
            cell.appendChild(viewport);
            // --- FIX END ---
        } else if (!def.oneWay) {
            // It's a standard, full-sized SOLID block. Render with background color.
            cell.style.backgroundColor = getPaletteColor(def.type);
        }
        
        // 3. Add one-way platform indicator (if applicable)
        if (def.oneWay) {
            cell.style.borderTop = `5px solid ${getPaletteColor(def.type)}`;
            if (!def.collisionBox) {
                 const color = getPaletteColor(def.type);
                 cell.style.backgroundColor = this._hexToRgba(color, 0.3);
            }
        }
    }
    
    // Helper to convert hex colors to rgba for transparency
    _hexToRgba(hex, alpha) {
        if (!hex) return '';
        if (hex.startsWith('rgba')) return hex; // Already in correct format
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) { // #RGB
            r = "0x" + hex[1] + hex[1];
            g = "0x" + hex[2] + hex[2];
            b = "0x" + hex[3] + hex[3];
        } else if (hex.length === 7) { // #RRGGBB
            r = "0x" + hex[1] + hex[2];
            g = "0x" + hex[3] + hex[4];
            b = "0x" + hex[5] + hex[6];
        }
        return `rgba(${+r},${+g},${+b},${alpha})`;
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