// Spritesheet metadata derived from Terrain.json
export const TILESET_CONFIG = {
    image: '/assets/Terrain/Terrain.png',
    tileWidth: 16,
    tileHeight: 16,
    columns: 22, // From imagewidth / tilewidth (352 / 16)
};

// New configuration for the special tiles spritesheet
export const TILESET_CONFIG_SPECIAL = {
    image: '/assets/Traps/Sand Mud Ice/Sand Mud Ice.png',
    tileWidth: 16,
    tileHeight: 16,
    columns: 12, // Image is 192px wide (192 / 16 = 12)
};

// An offset to distinguish between tiles from the main set and the special set.
export const SPECIAL_TILE_ID_OFFSET = 1000;

// Maps Tile IDs from the spritesheets to their gameplay properties.
export const TILE_PROPERTIES = {
    // --- Main Terrain Tiles ---
    0: { type: 'stone', solid: true }, 1: { type: 'stone', solid: true }, 2: { type: 'stone', solid: true },
    3: { type: 'stone', solid: true }, 4: { type: 'stone', solid: true }, 5: { type: 'stone', solid: true },
    6: { type: 'dirt', solid: true }, 7: { type: 'dirt', solid: true }, 8: { type: 'dirt', solid: true },
    9: { type: 'dirt', solid: true }, 10: { type: 'dirt', solid: true }, 11: { type: 'dirt', solid: true },
    17: { type: 'oneway_gold', solid: true, oneWay: true },
    22: { type: 'stone', solid: true }, 23: { type: 'stone', solid: true }, 24: { type: 'stone', solid: true },
    25: { type: 'stone', solid: true }, 26: { type: 'stone', solid: true }, 27: { type: 'stone', solid: true },
    28: { type: 'dirt', solid: true }, 29: { type: 'dirt', solid: true }, 30: { type: 'dirt', solid: true },
    31: { type: 'dirt', solid: true }, 32: { type: 'dirt', solid: true }, 33: { type: 'dirt', solid: true },
    39: { type: 'oneway_wood', solid: true, oneWay: true },
    44: { type: 'stone', solid: true }, 45: { type: 'stone', solid: true }, 46: { type: 'stone', solid: true },
    47: { type: 'stone', solid: true }, 48: { type: 'stone', solid: true }, 49: { type: 'stone', solid: true },
    50: { type: 'dirt', solid: true }, 51: { type: 'dirt', solid: true }, 52: { type: 'dirt', solid: true },
    53: { type: 'dirt', solid: true }, 54: { type: 'dirt', solid: true }, 55: { type: 'dirt', solid: true },
    61: { type: 'oneway_stone', solid: true, oneWay: true },
    88: { type: 'wood', solid: true }, 89: { type: 'wood', solid: true }, 90: { type: 'wood', solid: true },
    91: { type: 'wood', solid: true }, 92: { type: 'wood', solid: true }, 93: { type: 'wood', solid: true },
    94: { type: 'orange_dirt', solid: true }, 95: { type: 'orange_dirt', solid: true }, 96: { type: 'orange_dirt', solid: true },
    97: { type: 'orange_dirt', solid: true }, 98: { type: 'orange_dirt', solid: true }, 99: { type: 'orange_dirt', solid: true },
    110: { type: 'wood', solid: true }, 111: { type: 'wood', solid: true }, 112: { type: 'wood', solid: true },
    113: { type: 'wood', solid: true }, 114: { type: 'wood', solid: true }, 115: { type: 'wood', solid: true },
    116: { type: 'orange_dirt', solid: true }, 117: { type: 'orange_dirt', solid: true }, 118: { type: 'orange_dirt', solid: true },
    119: { type: 'orange_dirt', solid: true }, 120: { type: 'orange_dirt', solid: true }, 121: { type: 'orange_dirt', solid: true },
    132: { type: 'wood', solid: true }, 133: { type: 'wood', solid: true }, 134: { type: 'wood', solid: true },
    135: { type: 'wood', solid: true }, 136: { type: 'wood', solid: true }, 137: { type: 'wood', solid: true },
    138: { type: 'orange_dirt', solid: true }, 139: { type: 'orange_dirt', solid: true }, 140: { type: 'orange_dirt', solid: true },
    141: { type: 'orange_dirt', solid: true }, 142: { type: 'orange_dirt', solid: true }, 143: { type: 'orange_dirt', solid: true },
    176: { type: 'green_block', solid: true }, 177: { type: 'green_block', solid: true }, 178: { type: 'green_block', solid: true },
    179: { type: 'green_block', solid: true }, 180: { type: 'green_block', solid: true }, 181: { type: 'green_block', solid: true },
    182: { type: 'pink_dirt', solid: true }, 183: { type: 'pink_dirt', solid: true }, 184: { type: 'pink_dirt', solid: true },
    185: { type: 'pink_dirt', solid: true }, 186: { type: 'pink_dirt', solid: true }, 187: { type: 'pink_dirt', solid: true },
    198: { type: 'green_block', solid: true }, 199: { type: 'green_block', solid: true }, 200: { type: 'green_block', solid: true },
    201: { type: 'green_block', solid: true }, 202: { type: 'green_block', solid: true }, 203: { type: 'green_block', solid: true },
    204: { type: 'pink_dirt', solid: true }, 205: { type: 'pink_dirt', solid: true }, 206: { type: 'pink_dirt', solid: true },
    207: { type: 'pink_dirt', solid: true }, 208: { type: 'pink_dirt', solid: true }, 209: { type: 'pink_dirt', solid: true },
    220: { type: 'green_block', solid: true }, 221: { type: 'green_block', solid: true }, 222: { type: 'green_block', solid: true },
    223: { type: 'green_block', solid: true }, 224: { type: 'green_block', solid: true }, 225: { type: 'green_block', solid: true },
    226: { type: 'pink_dirt', solid: true }, 227: { type: 'pink_dirt', solid: true }, 228: { type: 'pink_dirt', solid: true },
    229: { type: 'pink_dirt', solid: true }, 230: { type: 'pink_dirt', solid: true }, 231: { type: 'pink_dirt', solid: true },

    // --- Fractional Platforms ---
    130: { type: 'wood', solid: true, collisionBox: { width: 48, height: 16 } },  // wood_third_h
    131: { type: 'wood', solid: true, collisionBox: { width: 16, height: 16 } },  // wood_ninth_sq
    152: { type: 'wood', solid: true, collisionBox: { width: 16, height: 48 } },  // wood_third_v
    153: { type: 'wood', solid: true, collisionBox: { width: 32, height: 32 } },  // wood_four_ninths_sq
    
    196: { type: 'stone', solid: true, collisionBox: { width: 48, height: 16 } }, // stone_third_h
    197: { type: 'stone', solid: true, collisionBox: { width: 16, height: 16 } }, // stone_ninth_sq
    218: { type: 'stone', solid: true, collisionBox: { width: 16, height: 48 } }, // stone_third_v
    219: { type: 'stone', solid: true, collisionBox: { width: 32, height: 32 } }, // stone_four_ninths_sq

    238: { type: 'orange_dirt', solid: true, collisionBox: { width: 48, height: 16 } }, // orange_dirt_third_h
    239: { type: 'orange_dirt', solid: true, collisionBox: { width: 16, height: 16 } }, // orange_dirt_ninth_sq
    // Assuming the next row starts at 238+22 = 260 for vertical pieces, this is an estimate
    260: { type: 'orange_dirt', solid: true, collisionBox: { width: 16, height: 48 } }, // orange_dirt_third_v
    261: { type: 'orange_dirt', solid: true, collisionBox: { width: 32, height: 32 } }, // orange_dirt_four_ninths_sq

    // --- Special Interaction Tiles (using offset) ---
    [SPECIAL_TILE_ID_OFFSET + 0]: { type: 'sand', solid: true, interaction: 'sand' },
    [SPECIAL_TILE_ID_OFFSET + 1]: { type: 'sand', solid: true, interaction: 'sand' },
    [SPECIAL_TILE_ID_OFFSET + 2]: { type: 'sand', solid: true, interaction: 'sand' },
    [SPECIAL_TILE_ID_OFFSET + 4]: { type: 'mud', solid: true, interaction: 'mud' },
    [SPECIAL_TILE_ID_OFFSET + 5]: { type: 'mud', solid: true, interaction: 'mud' },
    [SPECIAL_TILE_ID_OFFSET + 6]: { type: 'mud', solid: true, interaction: 'mud' },
    [SPECIAL_TILE_ID_OFFSET + 8]: { type: 'ice', solid: true, interaction: 'ice' },
    [SPECIAL_TILE_ID_OFFSET + 9]: { type: 'ice', solid: true, interaction: 'ice' },
    [SPECIAL_TILE_ID_OFFSET + 10]: { type: 'ice', solid: true, interaction: 'ice' },
    
    // Default properties for any unspecified tile ID
    default: { type: 'empty', solid: false }
};

export function getTileProperties(tileId) {
    return TILE_PROPERTIES[tileId] || TILE_PROPERTIES.default;
}