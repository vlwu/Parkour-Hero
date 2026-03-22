export const TILESET_CONFIG = {
    image: '/assets/Terrain/Terrain.png',
    tileWidth: 16,
    tileHeight: 16,
    columns: 22,
};

export const TILESET_CONFIG_SPECIAL = {
    image: '/assets/Traps/Sand Mud Ice/Sand Mud Ice.png',
    tileWidth: 16,
    tileHeight: 16,
    columns: 12,
};

export const TILESET_ASSETS = {
    block: '/assets/Terrain/Terrain.png',
    sand_mud_ice: '/assets/Traps/Sand Mud Ice/Sand Mud Ice.png',
    ice_particle: '/assets/Traps/Sand Mud Ice/Ice Particle.png',
    sand_particle: '/assets/Traps/Sand Mud Ice/Sand Particle.png',
    mud_particle: '/assets/Traps/Sand Mud Ice/Mud Particle.png'
};

export const SPECIAL_TILE_ID_OFFSET = 1000;

const properties = {

    0: { type: 'empty', solid: false },
    1: { type: 'stone', solid: true }, 2: { type: 'stone', solid: true }, 3: { type: 'stone', solid: true },
    4: { type: 'stone', solid: true }, 5: { type: 'stone', solid: true }, 6: { type: 'stone', solid: true },
    7: { type: 'dirt', solid: true }, 8: { type: 'dirt', solid: true }, 9: { type: 'dirt', solid: true },
    10: { type: 'dirt', solid: true }, 11: { type: 'dirt', solid: true }, 12: { type: 'dirt', solid: true },
    13: { type: 'wood', solid: true }, 14: { type: 'wood', solid: true }, 15: { type: 'wood', solid: true },
    16: { type: 'wood', solid: true },
    18: { type: 'oneway_gold', solid: true, oneWay: true }, 19: { type: 'oneway_gold', solid: true, oneWay: true }, 20: { type: 'oneway_gold', solid: true, oneWay: true },
    23: { type: 'stone', solid: true }, 24: { type: 'stone', solid: true }, 25: { type: 'stone', solid: true },
    26: { type: 'stone', solid: true }, 27: { type: 'stone', solid: true }, 28: { type: 'stone', solid: true },
    29: { type: 'dirt', solid: true }, 30: { type: 'dirt', solid: true }, 31: { type: 'dirt', solid: true },
    32: { type: 'dirt', solid: true }, 33: { type: 'dirt', solid: true }, 34: { type: 'dirt', solid: true },
    35: { type: 'wood', solid: true }, 36: { type: 'wood', solid: true }, 37: { type: 'wood', solid: true },
    38: { type: 'wood', solid: true },
    40: { type: 'oneway_wood', solid: true, oneWay: true }, 41: { type: 'oneway_wood', solid: true, oneWay: true }, 42: { type: 'oneway_wood', solid: true, oneWay: true },
    45: { type: 'stone', solid: true }, 46: { type: 'stone', solid: true }, 47: { type: 'stone', solid: true },
    48: { type: 'stone', solid: true }, 49: { type: 'stone', solid: true }, 50: { type: 'stone', solid: true },
    51: { type: 'dirt', solid: true }, 52: { type: 'dirt', solid: true }, 53: { type: 'dirt', solid: true },
    54: { type: 'dirt', solid: true }, 55: { type: 'dirt', solid: true }, 56: { type: 'dirt', solid: true },
    58: { type: 'wood', solid: true }, 59: { type: 'wood', solid: true }, 60: { type: 'wood', solid: true },
    62: { type: 'oneway_stone', solid: true, oneWay: true }, 63: { type: 'oneway_stone', solid: true, oneWay: true }, 64: { type: 'oneway_stone', solid: true, oneWay: true },
    89: { type: 'wood', solid: true }, 90: { type: 'wood', solid: true }, 91: { type: 'wood', solid: true },
    92: { type: 'wood', solid: true }, 93: { type: 'wood', solid: true }, 94: { type: 'wood', solid: true },
    95: { type: 'orange_dirt', solid: true }, 96: { type: 'orange_dirt', solid: true }, 97: { type: 'orange_dirt', solid: true },
    98: { type: 'orange_dirt', solid: true }, 99: { type: 'orange_dirt', solid: true }, 100: { type: 'orange_dirt', solid: true },
    101: { type: 'stone', solid: true }, 102: { type: 'stone', solid: true }, 103: { type: 'stone', solid: true },
    104: { type: 'stone', solid: true },
    106: { type: 'red_brick', solid: true }, 107: { type: 'red_brick', solid: true }, 108: { type: 'red_brick', solid: true },
    111: { type: 'wood', solid: true }, 112: { type: 'wood', solid: true }, 113: { type: 'wood', solid: true },
    114: { type: 'wood', solid: true }, 115: { type: 'wood', solid: true }, 116: { type: 'wood', solid: true },
    117: { type: 'orange_dirt', solid: true }, 118: { type: 'orange_dirt', solid: true }, 119: { type: 'orange_dirt', solid: true },
    120: { type: 'orange_dirt', solid: true }, 121: { type: 'orange_dirt', solid: true }, 122: { type: 'orange_dirt', solid: true },
    123: { type: 'stone', solid: true }, 124: { type: 'stone', solid: true }, 125: { type: 'stone', solid: true },
    126: { type: 'stone', solid: true },
    128: { type: 'red_brick', solid: true }, 129: { type: 'red_brick', solid: true }, 130: { type: 'red_brick', solid: true },
    133: { type: 'wood', solid: true }, 134: { type: 'wood', solid: true }, 135: { type: 'wood', solid: true },
    136: { type: 'wood', solid: true }, 137: { type: 'wood', solid: true }, 138: { type: 'wood', solid: true },
    139: { type: 'orange_dirt', solid: true }, 140: { type: 'orange_dirt', solid: true }, 141: { type: 'orange_dirt', solid: true },
    142: { type: 'orange_dirt', solid: true }, 143: { type: 'orange_dirt', solid: true }, 144: { type: 'orange_dirt', solid: true },
    146: { type: 'stone', solid: true }, 147: { type: 'stone', solid: true }, 148: { type: 'stone', solid: true },
    150: { type: 'red_brick', solid: true }, 151: { type: 'red_brick', solid: true }, 152: { type: 'red_brick', solid: true },
    177: { type: 'green_block', solid: true }, 178: { type: 'green_block', solid: true }, 179: { type: 'green_block', solid: true },
    180: { type: 'green_block', solid: true }, 181: { type: 'green_block', solid: true }, 182: { type: 'green_block', solid: true },
    183: { type: 'pink_dirt', solid: true }, 184: { type: 'pink_dirt', solid: true }, 185: { type: 'pink_dirt', solid: true },
    186: { type: 'pink_dirt', solid: true }, 187: { type: 'pink_dirt', solid: true }, 188: { type: 'pink_dirt', solid: true },
    189: { type: 'orange_dirt', solid: true }, 190: { type: 'orange_dirt', solid: true }, 191: { type: 'orange_dirt', solid: true },
    192: { type: 'orange_dirt', solid: true },
    194: { type: 'gold', solid: true }, 195: { type: 'gold', solid: true }, 196: { type: 'gold', solid: true },
    197: { type: 'gold', solid: true },
    199: { type: 'green_block', solid: true }, 200: { type: 'green_block', solid: true }, 201: { type: 'green_block', solid: true },
    202: { type: 'green_block', solid: true }, 203: { type: 'green_block', solid: true }, 204: { type: 'green_block', solid: true },
    205: { type: 'pink_dirt', solid: true }, 206: { type: 'pink_dirt', solid: true }, 207: { type: 'pink_dirt', solid: true },
    208: { type: 'pink_dirt', solid: true }, 209: { type: 'pink_dirt', solid: true }, 210: { type: 'pink_dirt', solid: true },
    211: { type: 'orange_dirt', solid: true }, 212: { type: 'orange_dirt', solid: true }, 213: { type: 'orange_dirt', solid: true },
    214: { type: 'orange_dirt', solid: true },
    216: { type: 'gold', solid: true }, 217: { type: 'gold', solid: true }, 218: { type: 'gold', solid: true },
    219: { type: 'gold', solid: true },
    221: { type: 'green_block', solid: true }, 222: { type: 'green_block', solid: true }, 223: { type: 'green_block', solid: true },
    224: { type: 'green_block', solid: true }, 225: { type: 'green_block', solid: true }, 226: { type: 'green_block', solid: true },
    227: { type: 'pink_dirt', solid: true }, 228: { type: 'pink_dirt', solid: true }, 229: { type: 'pink_dirt', solid: true },
    230: { type: 'pink_dirt', solid: true }, 231: { type: 'pink_dirt', solid: true }, 232: { type: 'pink_dirt', solid: true },
    234: { type: 'orange_dirt', solid: true }, 235: { type: 'orange_dirt', solid: true }, 236: { type: 'orange_dirt', solid: true },
    239: { type: 'gold', solid: true }, 240: { type: 'gold', solid: true }, 241: { type: 'gold', solid: true },

    default: { type: 'empty', solid: false }
};

const specialColumns = TILESET_CONFIG_SPECIAL.columns;


for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        const tileId = (row * specialColumns) + col + 1;
        properties[SPECIAL_TILE_ID_OFFSET + tileId] = { type: 'sand', solid: true, interaction: 'sand' };
    }
}


for (let row = 0; row < 3; row++) {
    for (let col = 4; col < 7; col++) {
        const tileId = (row * specialColumns) + col + 1;
        properties[SPECIAL_TILE_ID_OFFSET + tileId] = { type: 'mud', solid: true, interaction: 'mud' };
    }
}


for (let row = 0; row < 3; row++) {
    for (let col = 8; col < 11; col++) {
        const tileId = (row * specialColumns) + col + 1;
        properties[SPECIAL_TILE_ID_OFFSET + tileId] = { type: 'ice', solid: true, interaction: 'ice' };
    }
}

export const TILE_PROPERTIES = properties;

export function getTileProperties(tileId) {
    return TILE_PROPERTIES[tileId] || TILE_PROPERTIES.default;
}