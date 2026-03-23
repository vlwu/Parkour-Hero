export class BulletComponent {
    constructor({ damage = 50, speed = 200, sourceEntityId = null, piecesSpriteKey = null } = {}) {
        this.damage = damage;
        this.speed = speed;
        this.sourceEntityId = sourceEntityId;
        this.piecesSpriteKey = piecesSpriteKey;
        this.active = true;
    }
}