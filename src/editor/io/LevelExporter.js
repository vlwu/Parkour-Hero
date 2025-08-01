export class LevelExporter {
    static _encodeTileDataToRLE(tileData, width, height) {
        const grid = new Array(width * height).fill('0');
        tileData.forEach(tile => {
            const index = tile.y * width + tile.x;
            if (index < grid.length) {
                grid[index] = tile.id;
            }
        });

        if (grid.length === 0) return "";

        const rleParts = [];
        let currentTileId = grid[0];
        let count = 1;

        for (let i = 1; i < grid.length; i++) {
            if (grid[i] === currentTileId) {
                count++;
            } else {
                rleParts.push(`${count}:${currentTileId}`);
                currentTileId = grid[i];
                count = 1;
            }
        }
        rleParts.push(`${count}:${currentTileId}`);

        return rleParts.join(',');
    }

    static export(grid, objectManager, levelName, background) {
        const { startPos, finalEntities } = objectManager.getObjectsForExport(grid);

        const rleTileData = this._encodeTileDataToRLE(grid.getTileDataForExport(), grid.width, grid.height);

        const exportData = {
            name: levelName,
            gridWidth: grid.width,
            gridHeight: grid.height,
            background: background,
            startPosition: startPos,
            tileData: rleTileData, 
            entities: finalEntities,
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `${levelName.replace(/\s/g, '-')}.json`);
        dlAnchorElem.click();
        dlAnchorElem.remove();
    }
}