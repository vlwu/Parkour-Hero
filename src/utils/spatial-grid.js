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

    insert(obj) {
        const startX = Math.floor(obj.x / this.cellSize);
        const startY = Math.floor(obj.y / this.cellSize);
        const endX = Math.floor((obj.x + obj.width) / this.cellSize);
        const endY = Math.floor((obj.y + obj.height) / this.cellSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < this.widthInCells && y >= 0 && y < this.heightInCells) {
                    const index = y * this.widthInCells + x;
                    this.grid[index].push(obj);
                }
            }
        }
    }

    query(bounds) {
        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

        const results = new Set();
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < this.widthInCells && y >= 0 && y < this.heightInCells) {
                    const index = y * this.widthInCells + x;
                    this.grid[index].forEach(item => results.add(item));
                }
            }
        }
        return Array.from(results);
    }
}