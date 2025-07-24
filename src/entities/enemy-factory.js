import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { ENEMY_DEFINITIONS } from './enemy-definitions.js';

/**
 * Creates an enemy entity and adds its components to the entity manager.
 * This function acts as a recipe for creating different enemy types.
 * @param {EntityManager} entityManager The entity manager instance.
 * @param {string} type The type of enemy to create (e.g., 'mushroom').
 * @param {number} x The initial x-position in world coordinates.
 * @param {number} y The initial y-position in world coordinates.
 * @param {object} [config={}] Additional configuration from the level data.
 * @returns {number|null} The ID of the newly created enemy entity, or null if type is unknown.
 */
export function createEnemy(entityManager, type, x, y, config = {}) {
    const data = ENEMY_DEFINITIONS[type];
    if (!data) {
        console.warn(`Attempted to create an unknown enemy type: "${type}"`);
        return null;
    }

    const enemyEntityId = entityManager.createEntity();
    const initialState = data.ai.type === 'hop' || data.ai.type === 'turret' ? 'idle' : 'patrol';

    // --- Core Components ---
    entityManager.addComponent(enemyEntityId, new PositionComponent(x, y));
    entityManager.addComponent(enemyEntityId, new VelocityComponent());
    entityManager.addComponent(enemyEntityId, new StateComponent(initialState));
    entityManager.addComponent(enemyEntityId, new DynamicColliderComponent());

    // --- Enemy-Specific Components ---
    entityManager.addComponent(enemyEntityId, new EnemyComponent({
        type: type,
        patrol: {
            startX: x,
            distance: config.patrolDistance || 100,
            speed: data.ai.patrolSpeed || 50
        },
        aggroRange: data.ai.aggroRange,
        ...data.ai, // Spread all AI properties
        ...config.enemyProps // Allows for overrides from level data
    }));
    
    entityManager.addComponent(enemyEntityId, new KillableComponent({
        ...data.killable,
        ...config.killableProps // Allows for overrides
    }));

    // --- Physics and Rendering Components ---
    entityManager.addComponent(enemyEntityId, new CollisionComponent({
        type: 'solid',
        width: data.width,
        height: data.height,
    }));

    entityManager.addComponent(enemyEntityId, new RenderableComponent({
        spriteKey: data.spriteKey,
        width: data.width,
        height: data.height,
        animationState: initialState === 'idle' ? 'idle' : 'run',
    }));

    return enemyEntityId;
}