export class SpatialGrid {
    constructor(levelWidth, levelHeight, cellSize) {
        this.cellSize = cellSize;
        this.widthInCells = Math.ceil(levelWidth / cellSize);
        this.heightInCells = Math.ceil(levelHeight / cellSize);
        this.grid = new Array(this.widthInCells * this.heightInCells).fill(null).map(() => []);
    }

    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = [];
        }
    }

    getGridIndices(obj) {
        const indices = new Set();
        // Add a check to prevent crash if obj is undefined
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
                    indices.add(y * this.widthInCells + x);
                }
            }
        }
        return indices;
    }

    insert(obj) {
        const cellIndices = this.getGridIndices(obj);
        this.insertObjectIntoCells(obj, cellIndices);
    }

    insertObjectIntoCells(obj, cellIndices) {
        for (const index of cellIndices) {
            if (this.grid[index]) {
                this.grid[index].push(obj);
            }
        }
    }

    removeObjectFromCells(identifier, cellIndices) {
        const isTrap = typeof identifier === 'string';
        for (const index of cellIndices) {
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
        const results = new Set();
        const cellIndices = this.getGridIndices(bounds);

        for (const index of cellIndices) {
            if (this.grid[index]) {
                this.grid[index].forEach(item => results.add(item));
            }
        }
        return Array.from(results);
    }
}