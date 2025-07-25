export class PreviousPositionComponent {
    /**
     * Stores the position of an entity from the previous physics frame,
     * used for interpolation in the renderer.
     * @param {number} x The x-coordinate from the previous frame.
     * @param {number} y The y-coordinate from the previous frame.
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}