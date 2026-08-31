/**
 * SPATIAL HASH GRID
 * ---------------------------------------------------------------------
 * Partitions level space into 2D buckets of size `cellSize` (default 32px).
 * Reduces broadphase collision checks from O(N^2) to O(1) average.
 * 
 * Performance Optimizations:
 * - Pre-allocated 2D bucket array avoids per-frame GC allocations.
 * - Deduplication: Uses `_queryId` monotonically increasing counter to
 *   ensure multi-cell spanning entities are only returned once per query.
 */

export class SpatialGrid {
    constructor(levelWidth, levelHeight, cellSize) {
        this.cellSize = cellSize;
        this.widthInCells = Math.ceil(levelWidth / cellSize);
        this.heightInCells = Math.ceil(levelHeight / cellSize);
        this.grid = new Array(this.widthInCells * this.heightInCells).fill(null).map(() => []);
        
        // Reusable structures for zero-allocation queries
        this.queryResult = [];
        this.currentQueryId = 0;
        this.tempIndices = [];
    }

    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].length = 0; // Clear without reallocating
        }
    }

    getGridIndices(obj) {
        const indices = []; // We return a new array because components store this locally
        if (!obj || typeof obj.x === 'undefined') {
            console.warn("SpatialGrid.getGridIndices called with invalid object", obj);
            return indices;
        }
        const startX = Math.floor(obj.x / this.cellSize);
        const startY = Math.floor(obj.y / this.cellSize);
        const endX = Math.floor((obj.x + obj.width) / this.cellSize);
        const endY = Math.floor((obj.y + obj.height) / this.cellSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < this.widthInCells && y >= 0 && y < this.heightInCells) {
                    // Naturally deduplicated by the grid's coordinate progression
                    indices.push(y * this.widthInCells + x);
                }
            }
        }
        return indices;
    }

    _getGridIndicesShared(obj) {
        // Internal zero-allocation version used during queries
        this.tempIndices.length = 0;
        if (!obj || typeof obj.x === 'undefined') return this.tempIndices;
        
        const startX = Math.floor(obj.x / this.cellSize);
        const startY = Math.floor(obj.y / this.cellSize);
        const endX = Math.floor((obj.x + obj.width) / this.cellSize);
        const endY = Math.floor((obj.y + obj.height) / this.cellSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < this.widthInCells && y >= 0 && y < this.heightInCells) {
                    this.tempIndices.push(y * this.widthInCells + x);
                }
            }
        }
        return this.tempIndices;
    }

    insert(obj) {
        const cellIndices = this.getGridIndices(obj);
        this.insertObjectIntoCells(obj, cellIndices);
    }

    insertObjectIntoCells(obj, cellIndices) {
        for (let i = 0; i < cellIndices.length; i++) {
            const index = cellIndices[i];
            if (this.grid[index]) {
                this.grid[index].push(obj);
            }
        }
    }

    removeObjectFromCells(identifier, cellIndices) {
        const isTrap = typeof identifier === 'string';
        for (let i = 0; i < cellIndices.length; i++) {
            const index = cellIndices[i];
            const cell = this.grid[index];
            if (cell) {
                // Find the specific object to remove based on its unique ID
                const objectIndex = cell.findIndex(item => {
                    if (isTrap) return item.instance?.id === identifier;
                    return item.entityId === identifier;
                });

                if (objectIndex !== -1) {
                    cell.splice(objectIndex, 1);
                }
            }
        }
    }

    query(bounds) {
        this.currentQueryId++;
        this.queryResult.length = 0;
        const cellIndices = this._getGridIndicesShared(bounds);

        for (let i = 0; i < cellIndices.length; i++) {
            const index = cellIndices[i];
            if (this.grid[index]) {
                const cell = this.grid[index];
                for (let j = 0; j < cell.length; j++) {
                    const item = cell[j];
                    // Fast deduplication: tag items with the current query ID
                    if (item._queryId !== this.currentQueryId) {
                        item._queryId = this.currentQueryId;
                        this.queryResult.push(item);
                    }
                }
            }
        }
        return this.queryResult; // Return shared reference to avoid allocations
    }
}