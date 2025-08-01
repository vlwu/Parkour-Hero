export class LevelImporter {
    static _decodeRLEToTileData(rleString, width, height) {
        const tileData = [];
        if (!rleString) return tileData;

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
                callback(levelData);
            } catch (err) {
                alert('Error parsing JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}