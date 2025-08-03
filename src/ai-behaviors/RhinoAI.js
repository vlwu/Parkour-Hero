import { BaseAI } from './BaseAI.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS, EVENTS, GRID_CONSTANTS } from '../utils/constants.js';

export class RhinoAI extends BaseAI {
    _hasClearLineOfSight(playerData) {
        if (!playerData) return false;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const selfCenterX = this.pos.x + this.col.width / 2;
        const selfCenterY = this.pos.y + this.col.height / 2;
        const playerCenterX = playerData.x + playerData.width / 2;

        const step = selfCenterX < playerCenterX ? TILE_SIZE / 2 : -TILE_SIZE / 2;
        const distance = Math.abs(playerCenterX - selfCenterX);
        const numSteps = Math.floor(distance / Math.abs(step));

        for (let i = 1; i < numSteps; i++) {
            const checkX = selfCenterX + i * step;
            // We ignore one-way platforms as they shouldn't block line of sight horizontally
            if (this.level.isSolidAt(checkX, selfCenterY, true)) {
                return false; // Path is blocked
            }
        }

        return true; // Path is clear
    }

    update(dt) {
        const ai = this.enemy.ai;
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        const playerData = playerPos && playerCol ? { ...playerPos, ...playerCol } : null;

        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
                this.vel.vx = 0;
                this.renderable.animationState = ANIMATION_STATES.IDLE;

                if (playerData) {
                    const enemyEdges = this._getPlatformEdgesForEntity(this.pos, this.col);
                    const playerEdges = this._getPlatformEdgesForEntity(playerPos, playerCol);

                    const onSamePlatform = enemyEdges && playerEdges && enemyEdges.left === playerEdges.left && enemyEdges.right === playerEdges.right;
                    const verticalDistance = Math.abs((playerData.y + playerData.height / 2) - (this.pos.y + this.col.height / 2));
                    const onSameLevel = verticalDistance < this.col.height * 1.5;
                    const horizontalDistance = Math.abs((playerData.x + playerData.width / 2) - (this.pos.x + this.col.width / 2));
                    const inRange = horizontalDistance <= ai.aggroRange;

                    if (onSamePlatform && onSameLevel && inRange && this._hasClearLineOfSight(playerData)) {
                        this.renderable.direction = (playerData.x > this.pos.x) ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
                        this.state.currentState = ENEMY_STATES.CHARGING;
                        this.vel.vx = (this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1) * ai.initialSpeed;
                        eventBus.publish(EVENTS.START_SOUND_LOOP, { key: 'rhino_charge', volume: 0.5, channel: 'SFX' });
                    }
                }
                break;

            case ENEMY_STATES.CHARGING:
                this.renderable.animationState = ANIMATION_STATES.RUN;
                const directionMultiplier = this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1;

                this.vel.vx += directionMultiplier * ai.acceleration * dt;
                this.vel.vx = Math.max(-ai.maxSpeed, Math.min(ai.maxSpeed, this.vel.vx));

                const wallProbeX = this.renderable.direction === DIRECTIONS.RIGHT
                    ? this.pos.x + this.col.width + 1
                    : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true);

                if (hitWall) {
                    this.state.currentState = ENEMY_STATES.STUNNED;
                    this.renderable.animationState = ANIMATION_STATES.WALL_HIT;
                    this.renderable.animationFrame = 0;
                    this.vel.vx = -directionMultiplier * ai.reboundSpeed;
                    this.enemy.timer = ai.stunDuration;
                    eventBus.publish(EVENTS.STOP_SOUND_LOOP, { key: 'rhino_charge' });
                    eventBus.publish(EVENTS.PLAY_SOUND, { key: 'rhino_crash', volume: 1.0, channel: 'SFX' });
                    eventBus.publish(EVENTS.CAMERA_SHAKE_REQUESTED, { intensity: 10, duration: 0.2 });
                }
                break;

            case ENEMY_STATES.STUNNED:
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = ENEMY_STATES.IDLE;
                }
                break;
        }
    }
}