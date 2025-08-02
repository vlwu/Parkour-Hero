export class RenderableComponent {
    constructor({
        spriteKey,
        width,
        height,
        animationState = 'idle',
        animationFrame = 0,
        animationTimer = 0,
        direction = 'right',
        isVisible = true,
        rotation = 0
    }) {
        this.spriteKey = spriteKey;
        this.width = width;
        this.height = height;
        this.animationState = animationState;
        this.animationFrame = animationFrame;
        this.animationTimer = animationTimer;
        this.direction = direction;
        this.isVisible = isVisible;
        this.rotation = rotation;
    }
}