export class CollisionComponent {
    constructor({
        type = 'dynamic',
        solid = false,
        hazard = false,
        width,
        height,
        isGrounded = false,
        isAgainstWall = false,
        groundType = null
    }) {
        this.type = type;
        this.solid = solid;
        this.hazard = hazard;
        this.width = width;
        this.height = height;
        this.isGrounded = isGrounded;
        this.isAgainstWall = isAgainstWall;
        this.groundType = groundType;
        // ADDED: A reference to the entity this component is standing on.
        this.groundEntity = null;
    }
}