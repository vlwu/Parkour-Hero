export class Trap {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.width = config.width || 16;
        this.height = config.height || 16;
        this.type = config.type;

        this.id = `${this.type}-${Math.random().toString(36).substr(2, 9)}`;
        this._hitbox = { x: 0, y: 0, width: 0, height: 0 };
    }

    get hitbox() {
        this._hitbox.x = this.x - this.width / 2;
        this._hitbox.y = this.y - this.height / 2;
        this._hitbox.width = this.width;
        this._hitbox.height = this.height;
        return this._hitbox;
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