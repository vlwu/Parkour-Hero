export class CollisionComponent {
    /**
     * @param {object} props The properties for the collision component.
     * @param {'dynamic'|'solid'|'hazard'|'collectible'} [props.type='dynamic'] The physical type of the entity.
     * @param {boolean} [props.solid=false] Whether this entity presents a solid barrier.
     * @param {boolean} [props.hazard=false] Whether this entity is harmful.
     * @param {number} props.width The width of the collision bounding box.
     * @param {number} props.height The height of the collision bounding box.
     * @param {boolean} [props.isGrounded=false] State: Is the entity currently on the ground?
     * @param {boolean} [props.isAgainstWall=false] State: Is the entity currently against a wall?
     * @param {string|null} [props.groundType=null] State: The type of ground the entity is on (e.g., 'ice').
     */
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
    }
}