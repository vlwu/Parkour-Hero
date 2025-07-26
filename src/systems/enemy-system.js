import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { createAIBehavior } from '../ai-behaviors/index.js';

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
            const killable = entityManager.getComponent(enemyId, KillableComponent);

            if (enemy.type === 'snail' && !enemy.isDead) {
                if (enemy.snailState === 'walking') {
                    enemy.snailState = 'shell';
                    state.currentState = 'shell_patrol';
                    renderable.animationState = 'shell_idle';
                    renderable.animationFrame = 0;
                    collision.solid = true;
                    
                    killable.stompable = false;
                    enemy.immunityTimer = 0.4;  
                    
                    const pos = entityManager.getComponent(enemyId, PositionComponent);
                    eventBus.publish('createParticles', { x: pos.x + collision.width / 2, y: pos.y + collision.height / 2, type: 'snail_flee' });
                    eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });

                } else if (enemy.snailState === 'shell') {
                    enemy.isDead = true;
                    state.currentState = 'dying';
                    renderable.animationState = 'shell_top_hit';
                    renderable.animationFrame = 0;
                    renderable.animationTimer = 0;
                    collision.solid = false;
                    enemy.deathTimer = 0.5;
                    eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });
                }
            } else if (enemy && !enemy.isDead) {
                if (killable && !killable.stompable) {
                    eventBus.publish('playSound', { key: 'hit', volume: 0.9, channel: 'SFX' });
                    continue;
                }
                enemy.isDead = true;
                state.currentState = 'dying';
                renderable.animationState = 'hit';
                renderable.animationFrame = 0;
                renderable.animationTimer = 0;
                collision.solid = false;
                enemy.deathTimer = 0.5;
                eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });
            }
        }
        this.stompEvents = [];
    }

    update(dt, { entityManager, playerEntityId, level }) {
        this._processStompEvents(entityManager);
        const enemyEntities = entityManager.query([EnemyComponent, PositionComponent, VelocityComponent, StateComponent, RenderableComponent]);
        
        for (const id of enemyEntities) {
            const enemy = entityManager.getComponent(id, EnemyComponent);
            const pos = entityManager.getComponent(id, PositionComponent);
            const vel = entityManager.getComponent(id, VelocityComponent);
            const col = entityManager.getComponent(id, CollisionComponent);
            
            if (enemy.immunityTimer > 0) {
                enemy.immunityTimer -= dt;
                if (enemy.immunityTimer <= 0) {
                    const killable = entityManager.getComponent(id, KillableComponent);
                    if (killable) killable.stompable = true;
                }
            }

            if (enemy.isDead) {
                const wasDestroyed = this._updateDyingState(dt, enemy, vel, entityManager, id);
                if (wasDestroyed) continue;
            } else {
                const aiBehavior = createAIBehavior(enemy.ai.type, id, entityManager, level, playerEntityId);
                if (aiBehavior) {
                    aiBehavior.update(dt);
                }
            }

            if (enemy.type === 'slime' && enemy.ai.particleDropInterval && Math.abs(vel.vx) > 0) {
                enemy.particleDropTimer -= dt;
                if (enemy.particleDropTimer <= 0) {
                    enemy.particleDropTimer = enemy.ai.particleDropInterval;
                    const particlePos = { x: pos.x + col.width / 2, y: pos.y + col.height - 2 };
                    eventBus.publish('createParticles', { ...particlePos, type: 'slime_puddle' });
                    eventBus.publish('createSlimePuddle', particlePos);
                }
            }
            
            this._updateAnimation(dt, id, entityManager);
        }
    }

    _updateDyingState(dt, enemy, vel, entityManager, entityId) {
        vel.vx = 0;
        vel.vy += 200 * dt;
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            if (pos && col) {
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: 'enemy_death' });
            }
            entityManager.destroyEntity(entityId);
            return true;
        }
        return false;
    }

    _updateAnimation(dt, id, entityManager) {
        const renderable = entityManager.getComponent(id, RenderableComponent);
        const enemy = entityManager.getComponent(id, EnemyComponent);
        const animDef = ENEMY_DEFINITIONS[enemy.type]?.animations[renderable.animationState];
        if (!animDef) return;

        renderable.animationTimer += dt;
        if (renderable.animationTimer >= animDef.speed) {
            renderable.animationTimer -= animDef.speed;
            renderable.animationFrame++;
            if (renderable.animationFrame >= animDef.frameCount) {
                const nonLoopingStates = ['spikes_out', 'spikes_in', 'shell_wall_hit', 'hit'];
                if (nonLoopingStates.includes(renderable.animationState)) {
                    renderable.animationFrame = animDef.frameCount - 1;
                } else {
                    renderable.animationFrame = 0;
                }
            }
        }
    }
}