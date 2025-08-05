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
import { PlantAI } from './PlantAI.js';
import { TrunkAI } from './TrunkAI.js';
import { AngryPigAI } from './AngryPigAI.js';
import { ChameleonAI } from './ChameleonAI.js';
import { RockAI } from './RockAI.js';
import { SkullAI } from './SkullAI.js';
import { AI_TYPES } from '../utils/constants.js';

const aiBehaviorMap = {
    [AI_TYPES.PATROL]: PatrolAI,
    [AI_TYPES.GROUND_CHARGE]: GroundChargeAI,
    [AI_TYPES.DEFENSIVE_CYCLE]: DefensiveCycleAI,
    [AI_TYPES.SNAIL]: SnailAI,
    [AI_TYPES.FLYING_PATROL]: FlyingPatrolAI,
    [AI_TYPES.FLYING_SLAM]: FlyingSlamAI,
    [AI_TYPES.RADISH]: RadishAI,
    [AI_TYPES.BEE]: BeeAI,
    [AI_TYPES.BAT]: BatAI,
    [AI_TYPES.GHOST]: GhostAI,
    [AI_TYPES.RHINO]: RhinoAI,
    [AI_TYPES.PLANT]: PlantAI,
    [AI_TYPES.TRUNK]: TrunkAI,
    [AI_TYPES.ANGRYPIG]: AngryPigAI,
    [AI_TYPES.CHAMELEON]: ChameleonAI,
    [AI_TYPES.ROCK]: RockAI,
    [AI_TYPES.SKULL]: SkullAI,
};

export function createAIBehavior(type, entityId, entityManager, level, playerEntityId) {
    const BehaviorClass = aiBehaviorMap[type];
    if (BehaviorClass) {
        return new BehaviorClass(entityId, entityManager, level, playerEntityId);
    }
    console.warn(`No AI behavior found for type: ${type}`);
    return null;
}