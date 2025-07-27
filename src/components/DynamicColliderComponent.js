export class DynamicColliderComponent {
    constructor() {
        /**
         * A Set of numerical indices representing the cells
         * in the spatial grid that this entity currently occupies.
         * @type {Set<number>}
         */
        this._spatialGridCells = new Set();
    }
}