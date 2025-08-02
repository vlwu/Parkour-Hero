import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { EVENTS } from '../utils/constants.js';

export class FlyingAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.anchorY = this.pos.y;
        this.lastFrame = -1;

        this.bobbingAmplitude = this.enemy.ai.bobbingAmplitude || 8;
        this.gravity = this.enemy.ai.gravity || 120;
        this.flapForce = this.enemy.ai.flapForce || -140;
        this.tetherStrength = this.enemy.ai.tetherStrength || 5;
        this.soundRadius = this.enemy.ai.soundRadius || 200;
        this.flapFrames = this.enemy.ai.flapFrames || [5];
    }

    updateVerticalBobbing(dt) {
        this.vel.vy += this.gravity * dt;
        const distY = this.pos.y - this.anchorY;
        if (Math.abs(distY) > this.bobbingAmplitude) {
            this.vel.vy -= distY * this.tetherStrength * dt;
        }
        this.vel.vy = Math.max(-200, Math.min(200, this.vel.vy));
    }

    handleAnimationEvents() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        const currentFrame = this.renderable.animationFrame;

        if (currentFrame !== this.lastFrame && this.flapFrames.includes(currentFrame)) {
            this.vel.vy = this.flapForce;

            const particleX = this.pos.x + this.col.width / 2;
            const particleY = this.pos.y + this.col.height;

            eventBus.publish(EVENTS.CREATE_PARTICLES, {
                x: particleX,
                y: particleY,
                type: 'wing_flap',
            });
            if (playerPos) {
                const distance = Math.sqrt(Math.pow(playerPos.x - this.pos.x, 2) + Math.pow(playerPos.y - this.pos.y, 2));
                if (distance < this.soundRadius) {
                    eventBus.publish(EVENTS.PLAY_SOUND, { key: 'wing_flap', volume: 0.3, channel: 'SFX' });
                }
            }
        }
        this.lastFrame = currentFrame;
    }
}