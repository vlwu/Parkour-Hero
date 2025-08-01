import { TILESET_CONFIG, TILESET_CONFIG_SPECIAL, SPECIAL_TILE_ID_OFFSET, getTileProperties } from '../../entities/tile-definitions.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';
import { DOM } from '../ui/DOM.js';

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.zoomLevel = 1;
        this.tileData = new Array(width * height).fill(0);

        this.tilesetImage = new Image();
        this.tilesetImage.src = TILESET_CONFIG.image;
        this.specialTilesetImage = new Image();
        this.specialTilesetImage.src = TILESET_CONFIG_SPECIAL.image;

        this.gridLinesCanvas = document.createElement('canvas');
        this.tileCanvas = document.createElement('canvas');
        this.gridLinesCtx = this.gridLinesCanvas.getContext('2d');
        this.tileCtx = this.tileCanvas.getContext('2d');
        this.tileCtx.imageSmoothingEnabled = false;

        this.tilesetImage.onload = () => this.drawAllTiles();
        this.specialTilesetImage.onload = () => this.drawAllTiles();
    }

    generate() {
        DOM.gridContainer.innerHTML = '';
        DOM.gridContainer.style.width = `${this.width * GRID_CONSTANTS.TILE_SIZE}px`;
        DOM.gridContainer.style.height = `${this.height * GRID_CONSTANTS.TILE_SIZE}px`;

        this.gridLinesCanvas.width = this.width * GRID_CONSTANTS.TILE_SIZE;
        this.gridLinesCanvas.height = this.height * GRID_CONSTANTS.TILE_SIZE;
        this.tileCanvas.width = this.width * GRID_CONSTANTS.TILE_SIZE;
        this.tileCanvas.height = this.height * GRID_CONSTANTS.TILE_SIZE;

        DOM.gridContainer.appendChild(this.tileCanvas);
        DOM.gridContainer.appendChild(this.gridLinesCanvas);

        this.drawGridLines();
        this.drawAllTiles();
        this.autoFitScale();
    }

    resize(newWidth, newHeight, oldTileData = [], anchor = 'top-left') {
        const oldWidth = this.width;
        const oldHeight = this.height;
        this.width = newWidth;
        this.height = newHeight;

        const newTileDataArray = new Array(newWidth * newHeight).fill(0);
        const dx = newWidth - oldWidth;
        const dy = newHeight - oldHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (anchor.includes('right')) offsetX = -dx;
        else if (anchor.includes('center')) offsetX = -Math.floor(dx / 2);
        if (anchor.includes('bottom')) offsetY = -dy;
        else if (anchor.includes('middle')) offsetY = -Math.floor(dy / 2);

        for (let y = 0; y < oldHeight; y++) {
            for (let x = 0; x < oldWidth; x++) {
                const newX = x + offsetX;
                const newY = y + offsetY;
                if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
                    newTileDataArray[newY * newWidth + newX] = oldTileData[y * oldWidth + x];
                }
            }
        }
        this.tileData = newTileDataArray;
        this.generate();
    }

    drawGridLines() {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        this.gridLinesCtx.clearRect(0, 0, this.gridLinesCanvas.width, this.gridLinesCanvas.height);
        this.gridLinesCtx.strokeStyle = 'rgba(149, 165, 166, 0.1)';
        this.gridLinesCtx.lineWidth = 1;
        for (let x = 0; x <= this.width; x++) {
            this.gridLinesCtx.beginPath();
            this.gridLinesCtx.moveTo(x * TILE_SIZE, 0);
            this.gridLinesCtx.lineTo(x * TILE_SIZE, this.height * TILE_SIZE);
            this.gridLinesCtx.stroke();
        }
        for (let y = 0; y <= this.height; y++) {
            this.gridLinesCtx.beginPath();
            this.gridLinesCtx.moveTo(0, y * TILE_SIZE);
            this.gridLinesCtx.lineTo(this.width * TILE_SIZE, y * TILE_SIZE);
            this.gridLinesCtx.stroke();
        }
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
        const tileId = parseInt(tileIdStr, 10);
        this.tileData[index] = tileId;
        this.drawTileAtIndex(index);
    }

    drawTileAtIndex(index) {
        const tileId = this.tileData[index];
        const x = (index % this.width) * GRID_CONSTANTS.TILE_SIZE;
        const y = Math.floor(index / this.width) * GRID_CONSTANTS.TILE_SIZE;
        this.tileCtx.clearRect(x, y, GRID_CONSTANTS.TILE_SIZE, GRID_CONSTANTS.TILE_SIZE);

        if (tileId > 0) {
            const isSpecial = tileId > SPECIAL_TILE_ID_OFFSET;
            const sourceImage = isSpecial ? this.specialTilesetImage : this.tilesetImage;
            const sourceConfig = isSpecial ? TILESET_CONFIG_SPECIAL : TILESET_CONFIG;
            const localId = (isSpecial ? tileId - SPECIAL_TILE_ID_OFFSET : tileId) - 1;

            if (!sourceImage.complete || sourceImage.naturalWidth === 0) return;

            const sx = (localId % sourceConfig.columns) * sourceConfig.tileWidth;
            const sy = Math.floor(localId / sourceConfig.columns) * sourceConfig.tileHeight;

            this.tileCtx.drawImage(
                sourceImage,
                sx, sy, sourceConfig.tileWidth, sourceConfig.tileHeight,
                x, y, GRID_CONSTANTS.TILE_SIZE, GRID_CONSTANTS.TILE_SIZE
            );
        }
    }

    drawAllTiles() {
        this.tileCtx.clearRect(0, 0, this.tileCanvas.width, this.tileCanvas.height);
        for (let i = 0; i < this.tileData.length; i++) {
            this.drawTileAtIndex(i);
        }
    }

    getTileId(index) {
        return this.tileData[index]?.toString() || '0';
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
        for (let i = 0; i < this.tileData.length; i++) {
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