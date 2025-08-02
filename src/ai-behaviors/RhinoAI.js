import { BaseAI } from './BaseAI.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';

export class RhinoAI extends BaseAI {
    update(dt) {
        const ai = this.enemy.ai;
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        const playerData = playerPos && playerCol ? { ...playerPos, ...playerCol } : null;

        switch (this.state.currentState) {
            case 'idle':
                this.vel.vx = 0;
                this.renderable.animationState = 'idle';

                if (playerData) {
                    const enemyEdges = this._getPlatformEdgesForEntity(this.pos, this.col);
                    const playerEdges = this._getPlatformEdgesForEntity(playerPos, playerCol);

                    const onSamePlatform = enemyEdges && playerEdges && enemyEdges.left === playerEdges.left && enemyEdges.right === playerEdges.right;
                    const verticalDistance = Math.abs((playerData.y + playerData.height / 2) - (this.pos.y + this.col.height / 2));
                    const onSameLevel = verticalDistance < this.col.height * 1.5;
                    const horizontalDistance = Math.abs((playerData.x + playerData.width / 2) - (this.pos.x + this.col.width / 2));
                    const inRange = horizontalDistance <= ai.aggroRange;

                    if (onSamePlatform && onSameLevel && inRange) {
                        this.renderable.direction = (playerData.x > this.pos.x) ? 'right' : 'left';
                        this.state.currentState = 'charging';
                        this.vel.vx = (this.renderable.direction === 'right' ? 1 : -1) * ai.initialSpeed;
                        eventBus.publish('startSoundLoop', { key: 'rhino_charge', volume: 0.5, channel: 'SFX' });
                    }
                }
                break;

            case 'charging':
                this.renderable.animationState = 'run';
                const directionMultiplier = this.renderable.direction === 'right' ? 1 : -1;
                
                this.vel.vx += directionMultiplier * ai.acceleration * dt;
                this.vel.vx = Math.max(-ai.maxSpeed, Math.min(ai.maxSpeed, this.vel.vx));

                const wallProbeX = this.renderable.direction === 'right'
                    ? this.pos.x + this.col.width + 1
                    : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true);

                if (hitWall) {
                    this.state.currentState = 'stunned';
                    this.renderable.animationState = 'wall_hit';
                    this.renderable.animationFrame = 0;
                    this.vel.vx = -directionMultiplier * ai.reboundSpeed;
                    this.enemy.timer = ai.stunDuration;
                    eventBus.publish('stopSoundLoop', { key: 'rhino_charge' });
                    eventBus.publish('playSound', { key: 'rhino_crash', volume: 1.0, channel: 'SFX' });
                    eventBus.publish('cameraShakeRequested', { intensity: 10, duration: 0.2 });
                }
                break;

            case 'stunned':
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'idle';
                }
                break;
        }
    }
}