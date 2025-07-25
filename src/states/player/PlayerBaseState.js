export class PlayerBaseState {
    constructor(playerEntityId, entityManager) {
        this.entityId = playerEntityId;
        this.entityManager = entityManager;
    }

    enter() {}
    update(dt) { return null; }
    exit() {}
}