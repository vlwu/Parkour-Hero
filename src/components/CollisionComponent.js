export class CollisionComponent {
    constructor({
        type = 'dynamic',
        solid = false,
        hazard = false,
        width,
        height,
        isGrounded = false,
        isAgainstWall = false,
        hitCeiling = false,
        groundType = null
    }) {
        this.type = type;
        this.solid = solid;
        this.hazard = hazard;
        this.width = width;
        this.height = height;
        this.isGrounded = isGrounded;
        this.isAgainstWall = isAgainstWall;
        this.hitCeiling = hitCeiling;
        this.groundType = groundType;
        this.groundEntity = null;
        this.wallDirection = null;
    }
}