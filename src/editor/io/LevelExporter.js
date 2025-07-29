export class LevelExporter {
    static export(grid, objectManager, levelName, background) {
        const { startPos, finalEntities } = objectManager.getObjectsForExport();

        const exportData = {
            name: levelName,
            gridWidth: grid.width,
            gridHeight: grid.height,
            background: background,
            startPosition: startPos,
            layout: grid.getLayout(),
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