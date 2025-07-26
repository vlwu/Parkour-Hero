import { PatrolAI } from './PatrolAI.js';
import { GroundChargeAI } from './GroundChargeAI.js';
import { DefensiveCycleAI } from './DefensiveCycleAI.js';
import { SnailAI } from './SnailAI.js';

const aiBehaviorMap = {
    'patrol': PatrolAI,
    'ground_charge': GroundChargeAI,
    'defensive_cycle': DefensiveCycleAI,
    'snail': SnailAI,
};

/**
 * Creates an instance of an AI behavior strategy based on the provided type.
 * @param {string} type - The type of AI behavior to create (e.g., 'patrol').
 * @param {number} entityId - The ID of the enemy entity.
 * @param {object} entityManager - The EntityManager instance.
 * @param {object} level - The current level object.
 * @param {number|null} playerEntityId - The player's entity ID.
 * @returns {BaseAI|null} An instance of the requested AI behavior class or null if not found.
 */
export function createAIBehavior(type, entityId, entityManager, level, playerEntityId) {
    const BehaviorClass = aiBehaviorMap[type];
    if (BehaviorClass) {
        return new BehaviorClass(entityId, entityManager, level, playerEntityId);
    }
    console.warn(`No AI behavior found for type: ${type}`);
    return null;
}