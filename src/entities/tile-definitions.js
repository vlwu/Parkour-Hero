import { PLAYER_CONSTANTS } from "../utils/constants.js";

export const TILE_DEFINITIONS = {
  '0': { type: 'empty', solid: false, hazard: false, description: 'Empty space. The player can move freely through it.' },
  
  '1': { type: 'dirt', solid: true, hazard: false, spriteKey: 'block', spriteConfig: { srcX: 96, srcY: 0 }, description: 'A standard, solid block of dirt. Wall-jumps are not possible on this surface.' },
  '2': { type: 'stone', solid: true, hazard: false, spriteKey: 'block', spriteConfig: { srcX: 0, srcY: 0 }, description: 'A standard, solid block of stone. Players can wall-jump off this surface.' },
  '3': { type: 'wood', solid: true, hazard: false, spriteKey: 'block', spriteConfig: { srcX: 0, srcY: 64 }, description: 'A standard, solid block of wood. Players can wall-jump off this surface.' },
  '4': { type: 'green_block', solid: true, hazard: false, spriteKey: 'block', spriteConfig: { srcX: 0, srcY: 128 }, description: 'A solid, green-colored block. Players can wall-jump off this surface.' },
  '5': { type: 'orange_dirt', solid: true, hazard: false, spriteKey: 'block', spriteConfig: { srcX: 96, srcY: 64 }, description: 'Solid orange dirt. Wall-jumps are not possible on this surface.' },
  '6': { type: 'pink_dirt', solid: true, hazard: false, spriteKey: 'block', spriteConfig: { srcX: 96, srcY: 128 }, description: 'Solid pink dirt. Wall-jumps are not possible on this surface.' },
  
  '7': { type: 'sand', solid: true, hazard: false, spriteKey: 'sand_mud_ice', spriteConfig: { srcX: 0, srcY: 0 }, interaction: 'sand', description: 'A solid block of sand. Slows player movement. Wall-jumps are not possible.' },
  '8': { type: 'mud', solid: true, hazard: false, spriteKey: 'sand_mud_ice', spriteConfig: { srcX: 64, srcY: 0 }, interaction: 'mud', description: 'A solid block of mud. Reduces jump height. Wall-jumps are not possible.' },
  '9': { type: 'ice', solid: true, hazard: false, spriteKey: 'sand_mud_ice', spriteConfig: { srcX: 128, srcY: 0 }, interaction: 'ice', description: 'A solid block of slippery ice. Reduces friction. Wall-jumps are not possible.' },

  'A': { type: 'spike_up', solid: false, hazard: true, spriteKey: 'spike_two', description: 'A dangerous spike pointing upwards. Lethal to the touch.' },

  'F': { type: 'fire', solid: false, hazard: true, spriteKey: 'fire_on', interaction: 'fire_trap', description: 'A deadly fire trap. Avoid contact.' }
};