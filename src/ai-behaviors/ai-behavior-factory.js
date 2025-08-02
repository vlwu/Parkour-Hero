import { PatrolAI } from './PatrolAI.js';
import { GroundChargeAI } from './GroundChargeAI.js';
import { DefensiveCycleAI } from './DefensiveCycleAI.js';
import { SnailAI } from './SnailAI.js';
import { FlyingPatrolAI } from './FlyingPatrolAI.js';
import { FlyingSlamAI } from './FlyingSlamAI.js';
import { RadishAI } from './RadishAI.js';
import { BeeAI } from './BeeAI.js';
import { BatAI } from './BatAI.js';
import { GhostAI } from './GhostAI.js';
import { RhinoAI } from './RhinoAI.js';

const aiBehaviorMap = {
    'patrol': PatrolAI,
    'ground_charge': GroundChargeAI,
    'defensive_cycle': DefensiveCycleAI,
    'snail': SnailAI,
    'flying_patrol': FlyingPatrolAI,
    'flying_slam': FlyingSlamAI,
    'radish': RadishAI,
    'bee': BeeAI,
    'bat': BatAI,
    'ghost': GhostAI,
    'rhino': RhinoAI,
};

export function createAIBehavior(type, entityId, entityManager, level, playerEntityId) {
    const BehaviorClass = aiBehaviorMap[type];
    if (BehaviorClass) {
        return new BehaviorClass(entityId, entityManager, level, playerEntityId);
    }
    console.warn(`No AI behavior found for type: ${type}`);
    return null;
}