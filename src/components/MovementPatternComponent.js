export class MovementPatternComponent {
    /**
     * A component to define autonomous movement for traps or platforms.
     * @param {object} props The properties for the component.
     * @param {'linear' | 'circular' | 'pendulum' | 'path'} props.type The type of movement pattern.
     * @param {number} [props.speed=100] The speed of the movement in pixels per second.
     * @param {Array<object>} [props.path=[]] An array of {x, y} points for linear or path-based movement.
     * @param {object} [props.center={x: 0, y: 0}] The center point for circular or pendulum motion.
     * @param {number} [props.radius=100] The radius for circular motion.
     * @param {number} [props.angle=0] The starting angle for circular or pendulum motion.
     * @param {number} [props.arc=Math.PI / 2] The total arc of a pendulum swing.
     */
    constructor({
        type,
        speed = 100,
        path = [],
        center = { x: 0, y: 0 },
        radius = 100,
        angle = 0,
        arc = Math.PI / 2,
    }) {
        this.type = type;
        this.speed = speed;
        this.path = path;
        this.center = center;
        this.radius = radius;
        this.angle = angle;
        this.arc = arc;

        // Internal state, managed by the movement system
        this.currentPathIndex = 0;
        this.direction = 1; // For linear and pendulum patterns
    }
}