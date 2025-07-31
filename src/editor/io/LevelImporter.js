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

    static load(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const levelData = JSON.parse(event.target.result);

                if (levelData.gridWidth && levelData.tileData) {
                    // Check if tileData is in RLE format and convert it
                    if (typeof levelData.tileData === 'string') {
                        levelData.tileData = this._decodeRLEToTileData(levelData.tileData, levelData.gridWidth, levelData.gridHeight);
                    }
                    callback(levelData);
                } else {
                    alert('Invalid or outdated level format. Please use a level file with the current "tileData" structure.');
                }
            } catch (err) {
                alert('Error parsing JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}