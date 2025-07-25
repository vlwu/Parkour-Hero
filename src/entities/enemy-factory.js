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



    const initialTopLeftX = x - data.width / 2;
    const topLeftY = y - data.height / 2;

    entityManager.addComponent(enemyEntityId, new PositionComponent(initialTopLeftX, topLeftY));
    entityManager.addComponent(enemyEntityId, new VelocityComponent());
    entityManager.addComponent(enemyEntityId, new StateComponent(initialState));
    entityManager.addComponent(enemyEntityId, new DynamicColliderComponent());


    let patrolStartX = initialTopLeftX;
    if (data.ai.type === 'patrol') {


        patrolStartX = initialTopLeftX - (config.patrolDistance / 2);
    }

    const aiConfig = {
        ...data.ai,
        patrol: {
            startX: patrolStartX,
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

    let initialAnimationState;
    if (initialState === 'idle') {
        switch(type) {
            case 'slime':
                initialAnimationState = 'idle_run';
                break;
            case 'turtle':
                initialAnimationState = 'idle2';
                break;
            default:
                initialAnimationState = 'idle';
                break;
        }
    } else { // patrol
        if (type === 'slime') {
            initialAnimationState = 'idle_run';
        } else {
            initialAnimationState = (data.spriteKey === 'snail' ? 'walk' : 'run');
        }
    }

    entityManager.addComponent(enemyEntityId, new RenderableComponent({
        spriteKey: data.spriteKey,
        width: data.width,
        height: data.height,
        animationState: initialAnimationState,
        direction: config.startDirection || 'right',
    }));

    return enemyEntityId;
}