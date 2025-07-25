export class InputComponent {
    /**
     * Holds the processed input state for an entity for a single frame.
     * This decouples systems from the global input state, allowing them
     * to operate on any entity with this component.
     */
    constructor() {
        // Held states
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        this.dash = false;

        // "Just pressed" states for the current frame
        this.jumpPressedThisFrame = false;
        this.dashPressedThisFrame = false;
    }
}