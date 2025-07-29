export class LevelImporter {
    static load(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const levelData = JSON.parse(event.target.result);
                // Only accept the new format which must have gridWidth and tileData.
                if (levelData.gridWidth && levelData.tileData) {
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