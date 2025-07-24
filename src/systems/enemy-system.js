import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';

export class EnemySystem {
    constructor() {
        this.stompEvents = [];
        eventBus.subscribe('enemyStomped', (e) => this.stompEvents.push(e));
    }
    
    _processStompEvents(entityManager) {
        if (this.stompEvents.length === 0) return;

        for (const event of this.stompEvents) {
            const { enemyId } = event;
            const enemy = entityManager.getComponent(enemyId, EnemyComponent);
            const state = entityManager.getComponent(enemyId, StateComponent);
            const renderable = entityManager.getComponent(enemyId, RenderableComponent);
            const collision = entityManager.getComponent(enemyId, CollisionComponent);

            if (enemy && !enemy.isDead) {
                enemy.isDead = true;
                state.currentState = 'dying';
                renderable.animationState = 'death';
                renderable.animationFrame = 0;
                renderable.animationTimer = 0;
                collision.solid = false; // So player passes through it
                enemy.deathTimer = 0.5; // Half a second for death animation
                
                // Placeholder for a generic enemy stomp sound
                eventBus.publish('playSound', { key: 'hit', volume: 0.9, channel: 'SFX' });
            }
        }
        this.stompEvents = [];
    }

    update(dt, { entityManager, playerEntityId }) {
        this._processStompEvents(entityManager);
        
        const enemyEntities = entityManager.query([EnemyComponent, PositionComponent, VelocityComponent, StateComponent, RenderableComponent]);
        const playerPos = playerEntityId ? entityManager.getComponent(playerEntityId, PositionComponent) : null;

        for (const id of enemyEntities) {
            const enemy = entityManager.getComponent(id, EnemyComponent);
            const pos = entityManager.getComponent(id, PositionComponent);
            const vel = entityManager.getComponent(id, VelocityComponent);
            const state = entityManager.getComponent(id, StateComponent);
            const renderable = entityManager.getComponent(id, RenderableComponent);

            if (enemy.isDead) {
                this._updateDyingState(dt, enemy, vel, entityManager, id);
                continue;
            }

            switch (state.currentState) {
                case 'patrol':
                    this._updatePatrolState(pos, vel, enemy, renderable);
                    this._checkForPlayerAggro(pos, playerPos, enemy, state);
                    break;
                case 'chase':
                    this._checkForPlayerAggro(pos, playerPos, enemy, state);
                    break;
                case 'attack':
                    break;
            }
            
            if (vel.vx > 0) {
                renderable.direction = 'right';
            } else if (vel.vx < 0) {
                renderable.direction = 'left';
            }
        }
    }

    _updatePatrolState(pos, vel, enemy, renderable) {
        const { startX, distance, speed } = enemy.patrol;
        const leftBound = startX;
        const rightBound = startX + distance;

        if (vel.vx === 0) {
            vel.vx = speed;
            renderable.direction = 'right';
        }

        if (pos.x <= leftBound) {
            pos.x = leftBound;
            vel.vx = speed;
        } else if (pos.x >= rightBound) {
            pos.x = rightBound;
            vel.vx = -speed;
        }
        
        renderable.animationState = 'run';
    }

    _checkForPlayerAggro(enemyPos, playerPos, enemy, state) {
        if (!playerPos) return;

        const distance = Math.sqrt(
            Math.pow(playerPos.x - enemyPos.x, 2) +
            Math.pow(playerPos.y - enemyPos.y, 2)
        );

        if (distance <= enemy.aggroRange && state.currentState !== 'chase') {
            // state.currentState = 'chase';
        } else if (distance > enemy.aggroRange && state.currentState === 'chase') {
            // state.currentState = 'patrol';
        }
    }

    _updateDyingState(dt, enemy, vel, entityManager, entityId) {
        vel.vx = 0;
        vel.vy += 200 * dt; // Light gravity effect on death
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
            entityManager.destroyEntity(entityId);
        }
    }
}