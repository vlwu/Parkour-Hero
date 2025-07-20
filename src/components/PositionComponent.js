export class PositionComponent {
    /**
     * @param {number} x The x-coordinate in the game world.
     * @param {number} y The y-coordinate in the game world.
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}