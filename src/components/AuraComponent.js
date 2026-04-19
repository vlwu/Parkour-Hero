export class AuraComponent {
    constructor(config) {
        this.particleType = config.particleType || null;
        this.emitRate = config.emitRate || 0.1;
        this.ghostTrail = config.ghostTrail || false;
        this.orbiting = config.orbiting || false;
        this.bubbleShield = config.bubbleShield || false;
        this.radiantGlow = config.radiantGlow || false;
        this.timer = 0;
    }
}