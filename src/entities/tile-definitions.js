// Spritesheet metadata derived from Terrain.json
export const TILESET_CONFIG = {
    image: '/assets/Terrain/Terrain.png',
    tileWidth: 16,
    tileHeight: 16,
    columns: 22, // From imagewidth / tilewidth (352 / 16)
};

// Maps Tile IDs from the spritesheet to their gameplay properties.
// The key is the numerical ID of the tile (0-indexed, left-to-right, top-to-bottom).
export const TILE_PROPERTIES = {
    // Row 0: Stone
    0: { type: 'stone', solid: true }, 1: { type: 'stone', solid: true }, 2: { type: 'stone', solid: true },
    3: { type: 'stone', solid: true }, 4: { type: 'stone', solid: true }, 5: { type: 'stone', solid: true },
    // Row 0: Dirt
    6: { type: 'dirt', solid: true }, 7: { type: 'dirt', solid: true }, 8: { type: 'dirt', solid: true },
    9: { type: 'dirt', solid: true }, 10: { type: 'dirt', solid: true }, 11: { type: 'dirt', solid: true },
    // Row 0: One-way Gold
    17: { type: 'oneway_gold', solid: true, oneWay: true },

    // Row 1: Stone
    22: { type: 'stone', solid: true }, 23: { type: 'stone', solid: true }, 24: { type: 'stone', solid: true },
    25: { type: 'stone', solid: true }, 26: { type: 'stone', solid: true }, 27: { type: 'stone', solid: true },
    // Row 1: Dirt
    28: { type: 'dirt', solid: true }, 29: { type: 'dirt', solid: true }, 30: { type: 'dirt', solid: true },
    31: { type: 'dirt', solid: true }, 32: { type: 'dirt', solid: true }, 33: { type: 'dirt', solid: true },
     // Row 1: One-way Wood
    39: { type: 'oneway_wood', solid: true, oneWay: true },

    // Row 2: Stone
    44: { type: 'stone', solid: true }, 45: { type: 'stone', solid: true }, 46: { type: 'stone', solid: true },
    47: { type: 'stone', solid: true }, 48: { type: 'stone', solid: true }, 49: { type: 'stone', solid: true },
    // Row 2: Dirt
    50: { type: 'dirt', solid: true }, 51: { type: 'dirt', solid: true }, 52: { type: 'dirt', solid: true },
    53: { type: 'dirt', solid: true }, 54: { type: 'dirt', solid: true }, 55: { type: 'dirt', solid: true },
    // Row 2: One-way Stone
    61: { type: 'oneway_stone', solid: true, oneWay: true },

    // Row 4: Wood
    88: { type: 'wood', solid: true }, 89: { type: 'wood', solid: true }, 90: { type: 'wood', solid: true },
    91: { type: 'wood', solid: true }, 92: { type: 'wood', solid: true }, 93: { type: 'wood', solid: true },
    // Row 4: Orange Dirt
    94: { type: 'orange_dirt', solid: true }, 95: { type: 'orange_dirt', solid: true }, 96: { type: 'orange_dirt', solid: true },
    97: { type: 'orange_dirt', solid: true }, 98: { type: 'orange_dirt', solid: true }, 99: { type: 'orange_dirt', solid: true },

    // Row 5: Wood
    110: { type: 'wood', solid: true }, 111: { type: 'wood', solid: true }, 112: { type: 'wood', solid: true },
    113: { type: 'wood', solid: true }, 114: { type: 'wood', solid: true }, 115: { type: 'wood', solid: true },
    // Row 5: Orange Dirt
    116: { type: 'orange_dirt', solid: true }, 117: { type: 'orange_dirt', solid: true }, 118: { type: 'orange_dirt', solid: true },
    119: { type: 'orange_dirt', solid: true }, 120: { type: 'orange_dirt', solid: true }, 121: { type: 'orange_dirt', solid: true },

    // Row 6: Wood
    132: { type: 'wood', solid: true }, 133: { type: 'wood', solid: true }, 134: { type: 'wood', solid: true },
    135: { type: 'wood', solid: true }, 136: { type: 'wood', solid: true }, 137: { type: 'wood', solid: true },
    // Row 6: Orange Dirt
    138: { type: 'orange_dirt', solid: true }, 139: { type: 'orange_dirt', solid: true }, 140: { type: 'orange_dirt', solid: true },
    141: { type: 'orange_dirt', solid: true }, 142: { type: 'orange_dirt', solid: true }, 143: { type: 'orange_dirt', solid: true },

    // Row 8: Green Block
    176: { type: 'green_block', solid: true }, 177: { type: 'green_block', solid: true }, 178: { type: 'green_block', solid: true },
    179: { type: 'green_block', solid: true }, 180: { type: 'green_block', solid: true }, 181: { type: 'green_block', solid: true },
    // Row 8: Pink Dirt
    182: { type: 'pink_dirt', solid: true }, 183: { type: 'pink_dirt', solid: true }, 184: { type: 'pink_dirt', solid: true },
    185: { type: 'pink_dirt', solid: true }, 186: { type: 'pink_dirt', solid: true }, 187: { type: 'pink_dirt', solid: true },

    // Row 9: Green Block
    198: { type: 'green_block', solid: true }, 199: { type: 'green_block', solid: true }, 200: { type: 'green_block', solid: true },
    201: { type: 'green_block', solid: true }, 202: { type: 'green_block', solid: true }, 203: { type: 'green_block', solid: true },
    // Row 9: Pink Dirt
    204: { type: 'pink_dirt', solid: true }, 205: { type: 'pink_dirt', solid: true }, 206: { type: 'pink_dirt', solid: true },
    207: { type: 'pink_dirt', solid: true }, 208: { type: 'pink_dirt', solid: true }, 209: { type: 'pink_dirt', solid: true },

    // Row 10: Green Block
    220: { type: 'green_block', solid: true }, 221: { type: 'green_block', solid: true }, 222: { type: 'green_block', solid: true },
    223: { type: 'green_block', solid: true }, 224: { type: 'green_block', solid: true }, 225: { type: 'green_block', solid: true },
    // Row 10: Pink Dirt
    226: { type: 'pink_dirt', solid: true }, 227: { type: 'pink_dirt', solid: true }, 228: { type: 'pink_dirt', solid: true },
    229: { type: 'pink_dirt', solid: true }, 230: { type: 'pink_dirt', solid: true }, 231: { type: 'pink_dirt', solid: true },

    // Default properties for any unspecified tile ID
    default: { type: 'empty', solid: false }
};

/**
 * Retrieves the gameplay properties for a given tile ID.
 * @param {number} tileId - The numerical ID of the tile.
 * @returns {object} The properties of the tile.
 */
export function getTileProperties(tileId) {
    return TILE_PROPERTIES[tileId] || TILE_PROPERTIES.default;
}