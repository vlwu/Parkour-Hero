export class DynamicColliderComponent {
    constructor() {
        /**
         * An array of numerical indices representing the cells
         * in the spatial grid that this entity currently occupies.
         * @type {number[]}
         */
        this._spatialGridCells = [];
    }
}