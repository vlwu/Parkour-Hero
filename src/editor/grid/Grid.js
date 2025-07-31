import { TILESET_CONFIG, TILESET_CONFIG_SPECIAL, SPECIAL_TILE_ID_OFFSET, getTileProperties } from '../../entities/tile-definitions.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';
import { DOM } from '../ui/DOM.js';

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.zoomLevel = 1;
        
        this.tilesetImage = new Image();
        this.tilesetImage.src = TILESET_CONFIG.image;
        
        this.specialTilesetImage = new Image();
        this.specialTilesetImage.src = TILESET_CONFIG_SPECIAL.image;
    }

    generate() {
        DOM.gridContainer.innerHTML = '';
        DOM.gridContainer.style.gridTemplateColumns = `repeat(${this.width}, ${GRID_CONSTANTS.TILE_SIZE}px)`;
        DOM.gridContainer.style.width = `${this.width * GRID_CONSTANTS.TILE_SIZE}px`;
        DOM.gridContainer.style.height = `${this.height * GRID_CONSTANTS.TILE_SIZE}px`;

        for (let i = 0; i < this.width * this.height; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.tileId = '0';
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

        this.setZoom(Math.min(1.0, scaleX, scaleY));
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

    paintCell(index, tileIdStr) {
        const cell = DOM.gridContainer.children[index];
        if (!cell) return;

        const tileId = parseInt(tileIdStr, 10);
        cell.dataset.tileId = tileIdStr;

        let canvas = cell.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = GRID_CONSTANTS.TILE_SIZE;
            canvas.height = GRID_CONSTANTS.TILE_SIZE;
            cell.innerHTML = '';
            cell.appendChild(canvas);
        }
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (tileId > 0) {
            const isSpecial = tileId >= SPECIAL_TILE_ID_OFFSET;
            const sourceImage = isSpecial ? this.specialTilesetImage : this.tilesetImage;
            const sourceConfig = isSpecial ? TILESET_CONFIG_SPECIAL : TILESET_CONFIG;
            const localId = isSpecial ? tileId - SPECIAL_TILE_ID_OFFSET : tileId;

            if (!sourceImage.complete) return;

            const sx = (localId % sourceConfig.columns) * sourceConfig.tileWidth;
            const sy = Math.floor(localId / sourceConfig.columns) * sourceConfig.tileHeight;

            ctx.drawImage(
                sourceImage,
                sx, sy, sourceConfig.tileWidth, sourceConfig.tileHeight,
                0, 0, GRID_CONSTANTS.TILE_SIZE, GRID_CONSTANTS.TILE_SIZE
            );
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
        const properties = getTileProperties(parseInt(tileId, 10));
        return properties?.solid || false;
    }

    getTileDataForExport() {
        const tileData = [];
        const cells = DOM.gridContainer.children;
        for (let i = 0; i < cells.length; i++) {
            const tileId = this.getTileId(i);
            if (tileId !== '0') {
                const x = i % this.width;
                const y = Math.floor(i / this.width);
                tileData.push({ x, y, id: tileId });
            }
        }
        return tileData;
    }
}