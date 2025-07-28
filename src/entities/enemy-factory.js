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

    let initialState;
    if (data.ai.type === 'flying_patrol' || data.ai.type === 'radish' || data.ai.type === 'bee') {
        initialState = 'flying';
    } else if (data.ai.type === 'ground_charge' || data.ai.type === 'defensive_cycle') {
        initialState = 'idle';
    } else {
        initialState = 'patrol';
    }

    const initialTopLeftX = x - data.width / 2;
    const topLeftY = y - data.height / 2;

    entityManager.addComponent(enemyEntityId, new PositionComponent(initialTopLeftX, topLeftY));
    entityManager.addComponent(enemyEntityId, new VelocityComponent());
    entityManager.addComponent(enemyEntityId, new StateComponent(initialState));
    entityManager.addComponent(enemyEntityId, new DynamicColliderComponent());



    const { type: _enemyType, x: _enemyX, y: _enemyY, initialDragPos, ...aiOverrides } = config;
    const aiConfig = { ...data.ai, ...aiOverrides };

    entityManager.addComponent(enemyEntityId, new EnemyComponent({
        type: type,
        ai: aiConfig
    }));

    entityManager.addComponent(enemyEntityId, new KillableComponent({ ...data.killable }));

    const hitboxWidth = data.hitbox ? data.hitbox.width : data.width;
    const hitboxHeight = data.hitbox ? data.hitbox.height : data.height;

    entityManager.addComponent(enemyEntityId, new CollisionComponent({
        type: 'solid',
        width: hitboxWidth,
        height: hitboxHeight,
    }));

    let initialAnimationState;
    if (type === 'bluebird') {
        initialAnimationState = 'flying';
    } else if (initialState === 'idle') {
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
    } else if (type === 'radish') {
        initialAnimationState = 'idle1';
    } else if (type === 'bee') {
        initialAnimationState = 'idle';
    } else {
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