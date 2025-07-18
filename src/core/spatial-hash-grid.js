// Spatial hash grid for efficient broad-phase collision detection.
export class SpatialHashGrid {
  constructor(levelWidth, levelHeight, cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.widthInCells = Math.ceil(levelWidth / cellSize);
    this.heightInCells = Math.ceil(levelHeight / cellSize);
  }

  _getGridIndices(obj) {
    const x1 = Math.floor(obj.x / this.cellSize);
    const y1 = Math.floor(obj.y / this.cellSize);
    const objWidth = obj.width || obj.size || 0;
    const objHeight = obj.height || obj.size || 0;
    const x2 = Math.floor((obj.x + objWidth) / this.cellSize);
    const y2 = Math.floor((obj.y + objHeight) / this.cellSize);
    return { x1, y1, x2, y2 };
  }

  insert(obj) {
    const { x1, y1, x2, y2 } = this._getGridIndices(obj);
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const key = `${x},${y}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key).add(obj);
      }
    }
  }

  query(x, y, width = 0, height = 0) {
    const potentialColliders = new Set();
    const queryObj = { x, y, width, height };
    const { x1, y1, x2, y2 } = this._getGridIndices(queryObj);

    for (let j = y1; j <= y2; j++) {
      for (let i = x1; i <= x2; i++) {
        const key = `${i},${j}`;
        if (this.grid.has(key)) {
          for (const obj of this.grid.get(key)) {
            potentialColliders.add(obj);
          }
        }
      }
    }
    return Array.from(potentialColliders);
  }

  clear() {
    this.grid.clear();
  }
}