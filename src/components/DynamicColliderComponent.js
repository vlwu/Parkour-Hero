export class DynamicColliderComponent {
    /**
     * A tag component used to identify entities whose position in the spatial grid
     * needs to be updated every frame because they can move.
     * This distinguishes them from static, level-geometry colliders.
     */
    constructor() {
        // This component is just a tag; it needs no data.
    }
}