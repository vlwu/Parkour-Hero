export const OBJECT_DESCRIPTIONS = {
    'player_spawn': 'The player\'s starting position. Only one can be placed per level. Left-click and drag to move.',
    'fruit_apple': 'A standard collectible fruit.', 'fruit_bananas': 'A standard collectible fruit.',
    'fruit_cherries': 'A standard collectible fruit.', 'fruit_kiwi': 'A standard collectible fruit.',
    'fruit_melon': 'A standard collectible fruit.', 'fruit_orange': 'A standard collectible fruit.',
    'fruit_pineapple': 'A standard collectible fruit.', 'fruit_strawberry': 'A standard collectible fruit.',
    'trophy': 'The level\'s goal. Becomes active once all fruits are collected. Snaps to the ground.',
    'checkpoint': 'Saves the player\'s progress. The player will respawn here upon death. Snaps to the ground.',
    'trampoline': 'Bounces the player high into the air. Snaps to the ground.',
    'spike': 'A retractable spike trap. Extends when the player is near and retracts after a delay. Snaps to the ground.',
    'fire_trap': 'A block that erupts in flame when stepped on. Snaps to the ground.',
    'spiked_ball': 'A swinging spiked ball hazard. Place the anchor point; it does not snap to ground. Properties: chain length, swing arc, speed (period), and tilt amount.',
    'arrow_bubble': 'Pops on contact and pushes the player. Does not snap to surfaces. Its direction can be set in properties.',
    'fan': 'Periodically pushes the player. Must be attached to the edge of a solid platform. Direction is set automatically on placement but can be changed.'
};

export const PALETTE_ABBREVIATIONS = {
    // Items
    'player_spawn': 'SPN',
    'fruit_apple': 'APL', 'fruit_bananas': 'BAN', 'fruit_cherries': 'CHR',
    'fruit_kiwi': 'KWI', 'fruit_melon': 'MEL', 'fruit_orange': 'ORG',
    'fruit_pineapple': 'PNP', 'fruit_strawberry': 'STR',
    'trophy': 'GOL', 'checkpoint': 'CHK',
    // Traps
    'trampoline': 'TRP', 'spike': 'SPK', 'fire_trap': 'FIR',
    'spiked_ball': 'BAL', 'arrow_bubble': 'ARR', 'fan': 'FAN',
    // Terrain
    'empty': 'ERS', 'dirt': 'DRT', 'stone': 'STN', 'wood': 'WOD',
    'green_block': 'GRN', 'orange_dirt': 'ODT', 'pink_dirt': 'PDT',
    'sand': 'SND', 'mud': 'MUD', 'ice': 'ICE'
};

// Helper to get the color for a given item or tile type
export function getPaletteColor(type) {
    switch (type) {
        case 'dirt': case 'orange_dirt': case 'pink_dirt': return '#8B4513';
        case 'stone': return '#6c757d'; case 'wood': return '#A0522D';
        case 'green_block': return '#28a745'; case 'sand': return '#F4A460';
        case 'mud': return '#5D4037'; case 'ice': return '#5DADE2';
        case 'trampoline': return '#8e44ad';
        case 'spike': return '#e74c3c';
        case 'fire_trap': return '#f39c12';
        case 'spiked_ball': return '#7f8c8d';
        case 'arrow_bubble': return '#3498db';
        case 'fan': return '#95a5a6';
        case 'fruit_apple': return '#e74c3c';
        case 'fruit_bananas': return '#f1c40f';
        case 'fruit_cherries': return '#c0392b';
        case 'fruit_kiwi': return '#27ae60';
        case 'fruit_melon': return '#1abc9c';
        case 'fruit_orange': return '#e67e22';
        case 'fruit_pineapple': return '#f39c12';
        case 'fruit_strawberry': return '#d35400';
        case 'player_spawn': return '#2980b9';
        case 'trophy': return '#F39C12'; case 'checkpoint': return '#17a2b8';
        case 'empty': return 'rgba(0,0,0,0.3)'; default: return '#34495e';
    }
}