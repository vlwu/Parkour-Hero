export class RenderableComponent {
    /**
     * @param {object} props The properties for the renderable component.
     * @param {string} props.spriteKey The key to look up the asset sprite sheet.
     * @param {number} props.width The width of the entity for rendering.
     * @param {number} props.height The height of the entity for rendering.
     * @param {string} [props.animationState='idle'] The current state of animation (e.g., 'idle', 'run').
     * @param {object} [props.animationConfig={}] Configuration for different animation states.
     * @param {number} [props.animationFrame=0] The current frame index in the animation sequence.
     * @param {number} [props.animationTimer=0] A timer to control animation frame progression.
     * @param {string} [props.direction='right'] The direction the entity is facing for sprite flipping.
     * @param {boolean} [props.isVisible=true] Whether the entity should be rendered.
     */
    constructor({
        spriteKey,
        width,
        height,
        animationState = 'idle',
        animationConfig = {},
        animationFrame = 0,
        animationTimer = 0,
        direction = 'right',
        isVisible = true
    }) {
        this.spriteKey = spriteKey;
        this.width = width;
        this.height = height;
        this.animationState = animationState;
        this.animationConfig = animationConfig;
        this.animationFrame = animationFrame;
        this.animationTimer = animationTimer;
        this.direction = direction;
        this.isVisible = isVisible;
    }
}