import { PositionComponent } from '../components/PositionComponent.js';
import { PreviousPositionComponent } from '../components/PreviousPositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { createAIBehavior } from '../ai-behaviors/index.js';
import { createEnemy } from '../entities/enemy-factory.js';
import { DIRECTIONS, ENEMY_STATES } from '../utils/constants.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';
import { SplitOnDeathComponent } from '../components/SplitOnDeathComponent.js';
import { ShellComponent } from '../components/ShellComponent.js';
import { RageStateComponent } from '../components/RageStateComponent.js';
import { FallStateComponent } from '../components/FallStateComponent.js';

export class EnemySystem {
    constructor(collisionSystem) {
        this.collisionSystem = collisionSystem;
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
            const vel = entityManager.getComponent(enemyId, VelocityComponent);
            const pos = entityManager.getComponent(enemyId, PositionComponent);

            if (enemy.isDead) continue;
            
            let dies = true;

            if (state.currentState === 'charging' && ENEMY_DEFINITIONS[enemy.type]?.ai?.type === 'rhino') {
                eventBus.publish('stopSoundLoop', { key: 'rhino_charge' });
            }

            const shell = entityManager.getComponent(enemyId, ShellComponent);
            if (shell) {
                if (!shell.isActive) {
                    shell.isActive = true;
                    state.currentState = 'shell_patrol';
                    renderable.animationState = 'shell_idle';
                    renderable.animationFrame = 0;
                    collision.solid = true;
                    killable.stompable = false;
                    enemy.immunityTimer = 0.4;
                    eventBus.publish('createParticles', { x: pos.x + collision.width / 2, y: pos.y + collision.height / 2, type: 'snail_flee' });
                    dies = false;
                } else {
                    renderable.animationState = 'shell_top_hit';
                }
            }

            const fall = entityManager.getComponent(enemyId, FallStateComponent);
            if (fall) {
                if (!fall.isFalling && !fall.isGrounded) {
                    fall.isFalling = true;
                    vel.vy = 150;
                    killable.stompable = false;
                    enemy.immunityTimer = 0.5;
                    eventBus.publish('createParticles', { x: pos.x + collision.width / 2, y: pos.y, type: 'radish_leaf', leafIndex: 0 });
                    eventBus.publish('createParticles', { x: pos.x + collision.width / 2, y: pos.y, type: 'radish_leaf', leafIndex: 1 });
                    dies = false;
                }
            }

            const rage = entityManager.getComponent(enemyId, RageStateComponent);
            if (rage) {
                if (!rage.isRaging && !rage.isTransitioning) {
                    rage.isTransitioning = true;
                    state.currentState = 'hit';
                    renderable.animationState = 'hit1';
                    renderable.animationFrame = 0;
                    renderable.animationTimer = 0;
                    killable.stompable = false;
                    enemy.immunityTimer = 0.5;
                    dies = false;
                } else if (rage.isRaging) {
                    renderable.animationState = 'hit2';
                }
            }

            if (!dies) {
                eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });
                continue;
            }

            const split = entityManager.getComponent(enemyId, SplitOnDeathComponent);
            if (split) {
                const nextRockDef = ENEMY_DEFINITIONS[split.splitIntoType];
                if (nextRockDef) {
                    const originalBottomY = pos.y + collision.height;
                    const spawnY = originalBottomY - nextRockDef.height / 2;
                    const spawnX = pos.x + collision.width / 2;

                    const child1Id = createEnemy(entityManager, split.splitIntoType, spawnX - nextRockDef.width / 2, spawnY);
                    if (child1Id !== null) {
                        const child1Rend = entityManager.getComponent(child1Id, RenderableComponent);
                        if (child1Rend) child1Rend.direction = DIRECTIONS.LEFT;
                    }

                    const child2Id = createEnemy(entityManager, split.splitIntoType, spawnX + nextRockDef.width / 2, spawnY);
                    if (child2Id !== null) {
                        const child2Rend = entityManager.getComponent(child2Id, RenderableComponent);
                        if (child2Rend) child2Rend.direction = DIRECTIONS.RIGHT;
                    }
                }
                
                enemy.isDead = true;
                state.currentState = 'dying';
                renderable.animationState = 'hit';
                renderable.animationFrame = 0;
                renderable.animationTimer = 0;
                collision.solid = false;
                enemy.deathTimer = 0.05;
                eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });
                continue;
            }

            if (killable && !killable.stompable) {
                eventBus.publish('playSound', { key: 'hit', volume: 0.9, channel: 'SFX' });
                continue;
            }
            
            enemy.isDead = true;
            state.currentState = 'dying';
            
            if (renderable.animationState !== 'shell_top_hit' && renderable.animationState !== 'hit2') {
                renderable.animationState = 'hit';
            }
            
            renderable.animationFrame = 0;
            renderable.animationTimer = 0;
            collision.solid = false;
            enemy.deathTimer = 0.5;
            eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });
        }
        this.stompEvents = [];
    }

    _respawnEnemy(entityId, entityManager) {
        const enemy = entityManager.getComponent(entityId, EnemyComponent);
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const prevPos = entityManager.getComponent(entityId, PreviousPositionComponent);
        const vel = entityManager.getComponent(entityId, VelocityComponent);
        const state = entityManager.getComponent(entityId, StateComponent);
        const renderable = entityManager.getComponent(entityId, RenderableComponent);
        const killable = entityManager.getComponent(entityId, KillableComponent);
        const col = entityManager.getComponent(entityId, CollisionComponent);

        if (!enemy || !pos) return;

        enemy.isDead = false;
        enemy.respawnTimer = 0;
        enemy.immunityTimer = 0;
        enemy.deathTimer = 0;

        const shell = entityManager.getComponent(entityId, ShellComponent);
        if (shell) shell.isActive = false;

        const rage = entityManager.getComponent(entityId, RageStateComponent);
        if (rage) {
            rage.isRaging = false;
            rage.isTransitioning = false;
        }

        const fall = entityManager.getComponent(entityId, FallStateComponent);
        if (fall) {
            fall.isFalling = false;
            fall.isGrounded = false;
        }

        if (enemy.type === 'ghost') enemy.ghostState = ENEMY_STATES.APPEARING;
        if (enemy.type === 'skull') enemy.skullState = ENEMY_STATES.IDLE2;
        if (enemy.type === 'defensive_cycle') enemy.timer = enemy.ai.spikesInDuration;

        pos.x = enemy.spawnX;
        pos.y = enemy.spawnY;
        
        if (prevPos) {
            prevPos.x = enemy.spawnX;
            prevPos.y = enemy.spawnY;
        }

        vel.vx = 0;
        vel.vy = 0;

        state.currentState = enemy.initialState;
        
        renderable.isVisible = true;
        renderable.animationTimer = 0;
        renderable.animationFrame = 0;
        
        let initialAnimationState;
        if (enemy.type === 'bluebird') initialAnimationState = 'flying';
        else if (enemy.initialState === 'idle') {
             switch(enemy.type) {
                case 'slime': initialAnimationState = 'idle_run'; break;
                case 'turtle': initialAnimationState = 'idle2'; break;
                case 'skull': initialAnimationState = 'idle2'; break;
                default: initialAnimationState = 'idle'; break;
            }
        } else if (enemy.type === 'radish') initialAnimationState = 'idle1';
        else if (enemy.type === 'bee') initialAnimationState = 'idle';
        else {
            if (enemy.type === 'slime') initialAnimationState = 'idle_run';
            else initialAnimationState = (enemy.type === 'snail' ? 'walk' : 'run');
        }
        renderable.animationState = initialAnimationState;

        const def = ENEMY_DEFINITIONS[enemy.type];
        if (def && def.killable) {
            killable.stompable = def.killable.stompable;
            killable.dealsContactDamage = def.killable.dealsContactDamage;
        }

        col.solid = true;
        entityManager.addComponent(entityId, new DynamicColliderComponent());
        
        enemy.aiBehavior = null;
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
                if (enemy.respawnTimer > 0) {
                    enemy.respawnTimer -= dt;
                    if (enemy.respawnTimer <= 0) {
                        this._respawnEnemy(id, entityManager);
                    }
                    continue;
                }

                const deathAnimationFinished = this._updateDyingState(dt, enemy, vel, entityManager, id, col);
                if (deathAnimationFinished) {
                    if (entityManager.hasComponent(id, SplitOnDeathComponent)) {
                        this.collisionSystem.removeDynamicEntity(id, entityManager);
                        entityManager.destroyEntity(id);
                    } else {
                        enemy.respawnTimer = 5.0;
                        const renderable = entityManager.getComponent(id, RenderableComponent);
                        renderable.isVisible = false;
                        this.collisionSystem.removeDynamicEntity(id, entityManager);
                        entityManager.removeComponent(id, DynamicColliderComponent);
                        
                        eventBus.publish('createRespawnTimer', {
                            x: enemy.spawnX + col.width / 2,
                            y: enemy.spawnY + col.height / 2,
                            duration: 5.0
                        });
                    }
                }
                continue;
            } else {
                if (!enemy.aiBehavior) {
                    enemy.aiBehavior = createAIBehavior(enemy.ai.type, id, entityManager, level, playerEntityId);
                }
                if (enemy.aiBehavior) {
                    enemy.aiBehavior.update(dt);
                }
            }

            if (enemy.type === 'slime' && enemy.ai.particleDropInterval && Math.abs(vel.vx) > 0) {
                enemy.particleDropTimer -= dt;
                if (enemy.particleDropTimer <= 0) {
                    enemy.particleDropTimer = enemy.ai.particleDropInterval + (Math.random() * 0.1);
                    const renderable = entityManager.getComponent(id, RenderableComponent);
                    const spawnOffset = renderable.direction === 'right' ? 0 : col.width;
                    const particlePos = { x: pos.x + spawnOffset, y: pos.y + col.height - 2 };
                    eventBus.publish('createParticles', { ...particlePos, type: 'slime_puddle' });
                    eventBus.publish('createSlimePuddle', particlePos);
                }
            }

            if (enemy.type === 'ghost' && enemy.ai.particleDropInterval && Math.abs(vel.vx) > 0 && enemy.ghostState === 'visible') {
                enemy.particleDropTimer -= dt;
                if (enemy.particleDropTimer <= 0) {
                    enemy.particleDropTimer = enemy.ai.particleDropInterval + (Math.random() * 0.1);
                    const renderable = entityManager.getComponent(id, RenderableComponent);
                    const spawnOffset = renderable.direction === 'right' ? 0 : col.width;
                    const particlePos = { x: pos.x + spawnOffset, y: pos.y + col.height };
                    eventBus.publish('createParticles', { ...particlePos, type: 'ghost_particles', direction: renderable.direction });
                }
            }

            const shouldEmitDust = (
                (enemy.type === 'mushroom' || enemy.type.startsWith('rock') || enemy.type === 'trunk' || enemy.type === 'snail' || enemy.type === 'radish' || enemy.type === 'angrypig') &&
                col.isGrounded && Math.abs(vel.vx) > 0 &&
                (enemy.type !== 'snail' || entityManager.getComponent(id, ShellComponent)?.isActive === false) &&
                (enemy.type !== 'radish' || entityManager.getComponent(id, FallStateComponent)?.isGrounded === true) &&
                (enemy.type !== 'angrypig' || entityManager.getComponent(id, RageStateComponent)?.isRaging === false)
            );

            if (shouldEmitDust && enemy.ai.particleDropInterval) {
                enemy.particleDropTimer -= dt;
                if (enemy.particleDropTimer <= 0) {
                    enemy.particleDropTimer = enemy.ai.particleDropInterval + (Math.random() * 0.1);
                    const renderable = entityManager.getComponent(id, RenderableComponent);
                    const spawnOffset = renderable.direction === 'right' ? col.width / 4 : (col.width * 3) / 4;
                    const particlePos = { x: pos.x + spawnOffset, y: pos.y + col.height };
                    eventBus.publish('createParticles', { ...particlePos, type: 'enemy_walk_dust', direction: renderable.direction });
                }
            }

            this._updateAnimation(dt, id, entityManager);
        }
    }

    _updateDyingState(dt, enemy, vel, entityManager, entityId, col) {
        vel.vx = 0;
        vel.vy += 200 * dt;
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            if (pos && col) {
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: 'enemy_death' });
            }
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
                const nonLoopingStates = ['spikes_out', 'spikes_in', 'shell_wall_hit', 'hit', 'hit1', 'hit2', 'appear', 'disappear', 'hit_wall_1', 'hit_wall_2', 'shell_top_hit'];
                if (nonLoopingStates.includes(renderable.animationState)) {
                    renderable.animationFrame = animDef.frameCount - 1;
                } else {
                    renderable.animationFrame = 0;
                }
            }
        }
    }
}