/**
 * A base class template for all trap objects in the game.
 * It defines the common interface that the core systems (Level, Renderer, CollisionSystem)
 * will use to interact with any trap, regardless of its specific type.
 */
export class Trap {
    /**
     * @param {number} x The initial x-position in the game world.
     * @param {number} y The initial y-position in the game world.
     * @param {object} config The configuration object from the level data.
     */
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.width = config.width || 16;
        this.height = config.height || 16;
        this.type = config.type;
        // A unique ID can be useful for debugging
        this.id = `${this.type}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Called every frame by the Level class to update the trap's internal state.
     * @param {number} dt Delta time, the time in seconds since the last frame.
     * @param {object} playerPos The player's position component.
     * @param {object} eventBus The global event bus for publishing events like sound.
     */
    update(dt, playerPos, eventBus) {
        // Each trap will implement its own update logic (e.g., animation, state changes).
    }

    /**
     * Called by the Renderer to draw the trap on the canvas.
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {object} assets The game's asset manager.
     * @param {Camera} camera The game camera.
     */
    render(ctx, assets, camera) {
        // Each trap will implement its own rendering logic.
    }

    /**
     * Called by the CollisionSystem when the player interacts with the trap.
     * @param {object} player A simplified object containing player data { pos, vel, col, entityId }.
     * @param {object} eventBus The global event bus.
     */
    onCollision(player, eventBus) {
        // Each trap will handle its own collision effects (e.g., dealing damage).
    }

    /**
     * Resets the trap to its initial state when the level restarts.
     */
    reset() {
        // Each trap will implement its own reset logic.
    }
}