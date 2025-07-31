import { TILESET_CONFIG } from "../../entities/tile-definitions";

export class LevelImporter {
    static _decodeRLEToTileData(rleString, width, height) {
        if (!rleString) return [];
        const tileData = [];
        const parts = rleString.split(',');
        let i = 0;
        for (const part of parts) {
            const [countStr, tileId] = part.split(':');
            const count = parseInt(countStr, 10);
            for (let j = 0; j < count; j++) {
                if (i >= width * height) break;
                // In the new system, tileId can be any number from the spritesheet
                if (tileId !== '0') {
                    const x = i % width;
                    const y = Math.floor(i / width);
                    tileData.push({ x, y, id: tileId });
                }
                i++;
            }
        }
        return tileData;
    }

    static _decodeLegacyLayoutToTileData(layout, width) {
        const tileData = [];
        if (!layout || !Array.isArray(layout)) return tileData;

        // Legacy mapping from old character IDs to new spritesheet IDs
        const legacyIdMap = {
            '1': 6, '2': 0, '3': 88, '4': 176, '5': 94, '6': 182,
            'a': 17, 'b': 39, 'c': 61
        };

        layout.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const legacyId = row[x];
                const newId = legacyIdMap[legacyId];
                if (newId) {
                    tileData.push({ x, y, id: newId.toString() });
                }
            }
        });
        return tileData;
    }

    static load(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const levelData = JSON.parse(event.target.result);

                // Check for new RLE format first
                if (levelData.gridWidth && typeof levelData.tileData === 'string') {
                    levelData.tileData = this._decodeRLEToTileData(levelData.tileData, levelData.gridWidth, levelData.gridHeight);
                }
                // Fallback for old layout format
                else if (levelData.layout) {
                    console.warn("Loading a level with a legacy 'layout' format. Converting to new tile data structure.");
                    levelData.tileData = this._decodeLegacyLayoutToTileData(levelData.layout, levelData.gridWidth);
                }
                
                callback(levelData);

            } catch (err) {
                alert('Error parsing JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}