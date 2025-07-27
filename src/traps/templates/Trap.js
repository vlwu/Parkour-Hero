export class Trap {

    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.width = config.width || 16;
        this.height = config.height || 16;
        this.type = config.type;

        this.id = `${this.type}-${Math.random().toString(36).substr(2, 9)}`;
    }

    update(dt, playerPos, eventBus, level) { // Added level for consistency with other traps
    }

    onCollision(player, eventBus) {
    }

    reset(eventBus) { // Added eventBus for consistency
    }
}