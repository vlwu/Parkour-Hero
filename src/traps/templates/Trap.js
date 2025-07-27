export class Trap {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.width = config.width || 16;
        this.height = config.height || 16;
        this.type = config.type;

        this.id = `${this.type}-${Math.random().toString(36).substr(2, 9)}`;
    }

    update(dt, playerPos, eventBus) {}

    /**
     * @param {object} assets - The global assets object.
     * @param {object} textures - The global WebGL textures object.
     * @returns {object|array|null} Data needed for the WebGL renderer.
     */
    getRenderableData(assets, textures) {
        // To be implemented by subclasses
        return null;
    }

    onCollision(player, eventBus) {}

    reset() {}
}