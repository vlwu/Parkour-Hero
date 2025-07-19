import { PLAYER_CONSTANTS } from "../utils/constants.js";

/**
 * A central repository for defining the properties of every static tile in the game.
 * Each key is a character that will be used in the level layout's 2D array.
 *
 * Properties:
 * - type: A readable name for the tile (e.g., 'dirt', 'spike_up').
 * - solid: A boolean indicating if the player can collide with and stand on this tile.
 * - hazard: A boolean indicating if contact with this tile should harm the player.
 * - spriteKey: The key for the asset to be used for rendering (from asset-manager.js).
 * - spriteConfig: (Optional) The x/y source coordinates for tiles on a shared spritesheet.
 * - interaction: (Optional) A special behavior associated with the tile.
 */
export const TILE_DEFINITIONS = {
  // --- Empty Space ---
  '0': { type: 'empty', solid: false, hazard: false },

  // --- Standard Solid Blocks (from platform.js) ---
  '1': { type: 'dirt',        solid: true, hazard: false, spriteKey: 'block',        spriteConfig: { srcX: 96,  srcY: 0   } },
  '2': { type: 'stone',       solid: true, hazard: false, spriteKey: 'block',        spriteConfig: { srcX: 0,   srcY: 0   } },
  '3': { type: 'wood',        solid: true, hazard: false, spriteKey: 'block',        spriteConfig: { srcX: 0,   srcY: 64  } },
  '4': { type: 'green_block', solid: true, hazard: false, spriteKey: 'block',        spriteConfig: { srcX: 0,   srcY: 128 } },
  '5': { type: 'orange_dirt', solid: true, hazard: false, spriteKey: 'block',        spriteConfig: { srcX: 96,  srcY: 64  } },
  '6': { type: 'pink_dirt',   solid: true, hazard: false, spriteKey: 'block',        spriteConfig: { srcX: 96,  srcY: 128 } },

  // --- Surface-Effect Blocks (from platform.js) ---
  '7': { type: 'sand', solid: true, hazard: false, spriteKey: 'sand_mud_ice', spriteConfig: { srcX: 0,   srcY: 0 }, interaction: 'sand' },
  '8': { type: 'mud',  solid: true, hazard: false, spriteKey: 'sand_mud_ice', spriteConfig: { srcX: 64,  srcY: 0 }, interaction: 'mud' },
  '9': { type: 'ice',  solid: true, hazard: false, spriteKey: 'sand_mud_ice', spriteConfig: { srcX: 128, srcY: 0 }, interaction: 'ice' },

  // --- Static Hazards ---
  'A': { type: 'spike_up',    solid: false, hazard: true, spriteKey: 'spike_two' },
  // Future hazard definitions (e.g., 'B' for spike_down, 'C' for spike_left) would go here.

  // --- Interactive Blocks ---
  'T': { type: 'trampoline', solid: true, hazard: false, spriteKey: 'trampoline_idle', interaction: 'bounce' },
  'F': { type: 'fire', solid: false, hazard: true, spriteKey: 'fire_on', interaction: 'fire_trap' }
};