import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { ENEMY_DEFINITIONS } from './enemy-definitions.js';

export function createEnemy(entityManager, type, x, y, config = {}) {
    const data = ENEMY_DEFINITIONS[type];
    if (!data) {
        console.warn(`Attempted to create an unknown enemy type: "${type}"`);
        return null;
    }

    const enemyEntityId = entityManager.createEntity();
    const initialState = data.ai.type === 'hop' || data.ai.type === 'defensive_cycle' || data.ai.type === 'ground_charge' ? 'idle' : 'patrol';

    entityManager.addComponent(enemyEntityId, new PositionComponent(x, y));
    entityManager.addComponent(enemyEntityId, new VelocityComponent());
    entityManager.addComponent(enemyEntityId, new StateComponent(initialState));
    entityManager.addComponent(enemyEntityId, new DynamicColliderComponent());

    const aiConfig = {
        ...data.ai,
        patrol: {
            startX: x,
            distance: config.patrolDistance || 100,
            speed: data.ai.patrolSpeed || 50
        }
    };
    entityManager.addComponent(enemyEntityId, new EnemyComponent({
        type: type,
        ai: aiConfig
    }));
    
    entityManager.addComponent(enemyEntityId, new KillableComponent({ ...data.killable }));

    entityManager.addComponent(enemyEntityId, new CollisionComponent({
        type: 'solid',
        width: data.width,
        height: data.height,
    }));

    entityManager.addComponent(enemyEntityId, new RenderableComponent({
        spriteKey: data.spriteKey,
        width: data.width,
        height: data.height,
        animationState: initialState === 'idle' ? 'idle' : (data.spriteKey === 'snail' ? 'walk' : 'run'),
        direction: config.startDirection || 'right', // Use startDirection from JSON, default to right
    }));

    return enemyEntityId;
}