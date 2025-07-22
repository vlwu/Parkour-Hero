export class LevelImporter {
    static load(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const levelData = JSON.parse(event.target.result);
                if (levelData.gridWidth) {
                    callback(levelData);
                } else if (levelData.platforms) {
                    alert('Old level format detected. Conversion is no longer supported.');
                } else {
                    alert('Unrecognized level format.');
                }
            } catch (err) {
                alert('Error parsing JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}