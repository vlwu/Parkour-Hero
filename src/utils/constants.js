export const PLAYER_CONSTANTS = {

  // Visual representation of the player.
  SPRITE_WIDTH: 32,
  SPRITE_HEIGHT: 32,

  // Hitbox for collision detection. Adjust these values for gameplay feel.
  WIDTH: 26,
  HEIGHT: 26,

  // Larger visual size for spawn/despawn animations.
  SPAWN_WIDTH: 96,
  SPAWN_HEIGHT: 96,
  CLING_OFFSET: 5,


  MOVE_SPEED: 200,
  JUMP_FORCE: 400,
  GRAVITY: 1200,
  MAX_FALL_SPEED: 600,


  FALL_DAMAGE_MIN_VELOCITY: 525,
  FALL_DAMAGE_MAX_VELOCITY: 650,
  FALL_DAMAGE_MIN_AMOUNT: 8,
  FALL_DAMAGE_MAX_AMOUNT: 20,


  DASH_SPEED: 500,
  DASH_DURATION: 0.2,
  DASH_COOLDOWN: 0.7,


  COYOTE_TIME: 0.1,
  JUMP_BUFFER_TIME: 0.15,
  HIT_STUN_DURATION: 0.2,


  SAND_MOVE_MULTIPLIER: 0.3,
  ICE_ACCELERATION: 800,
  ICE_FRICTION: 400,
  TRAMPOLINE_BOUNCE_MULTIPLIER: 2,


  ANIMATIONS: {
    idle: { frameCount: 11, speed: 0.06 },
    run: { frameCount: 12, speed: 0.06 },
    double_jump: { frameCount: 6, speed: 0.06 },
    jump: { frameCount: 1, speed: 0.06 },
    fall: { frameCount: 1, speed: 0.06 },
    dash: { frameCount: 1, speed: 0.06 },
    cling: { frameCount: 5, speed: 0.06 },
    spawn: { frameCount: 7, speed: 0.08 },
    despawn: { frameCount: 7, speed: 0.08 },
    hit: { frameCount: 7, speed: 0.1 },
  }
};

export const GRID_CONSTANTS = {
  TILE_SIZE: 16,
};

export const TRAP_CONSTANTS = {
  DEFAULT_HAZARD_DAMAGE: 25,

  SPIKE_DAMAGE: 20,
  SPIKE_KNOCKBACK_X: 150,
  SPIKE_KNOCKBACK_Y: -200,

  SPIKED_BALL_DAMAGE: 50,
  SPIKED_BALL_KNOCKBACK_BASE: 200,
  SPIKED_BALL_KNOCKBACK_Y_BOOST: -150,

  SAW_DAMAGE: 35,
  SAW_KNOCKBACK_BASE: 250,
  SAW_KNOCKBACK_Y_BOOST: -100,

  FIRE_TRAP_DAMAGE: 15,
  FIRE_TRAP_DAMAGE_INTERVAL: 1.0,
};

export const DIRECTIONS = Object.freeze({
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
});

export const AI_TYPES = Object.freeze({
    PATROL: 'patrol',
    GROUND_CHARGE: 'ground_charge',
    DEFENSIVE_CYCLE: 'defensive_cycle',
    SNAIL: 'snail',
    FLYING_PATROL: 'flying_patrol',
    FLYING_SLAM: 'flying_slam',
    RADISH: 'radish',
    BEE: 'bee',
    BAT: 'bat',
    GHOST: 'ghost',
    RHINO: 'rhino',
    PLANT: 'plant',
    TRUNK: 'trunk',
    ANGRYPIG: 'angrypig',
    CHAMELEON: 'chameleon',
    ROCK: 'rock',
    SKULL: 'skull'
});

export const PLAYER_STATES = Object.freeze({
    IDLE: 'idle',
    RUN: 'run',
    JUMP: 'jump',
    DOUBLE_JUMP: 'double_jump',
    FALL: 'fall',
    DASH: 'dash',
    CLING: 'cling',
    SPAWN: 'spawn',
    DESPAWN: 'despawn',
    HIT: 'hit'
});

export const ENEMY_STATES = Object.freeze({
    IDLE: 'idle',
    IDLE1: 'idle1',
    IDLE2: 'idle2',
    IDLE_GROUNDED: 'idle_grounded',
    PATROL: 'patrol',
    PATROL_GROUNDED: 'patrol_grounded',
    CHARGING: 'charging',
    COOLDOWN: 'cooldown',
    DYING: 'dying',
    FLYING: 'flying',
    FALLING: 'falling',
    GROUNDED: 'grounded',
    SHELL: 'shell',
    WALKING: 'walking',
    RAGING: 'raging',
    TRANSITIONING: 'transitioning',
    SHELL_PATROL: 'shell_patrol',
    SHELL_HIT_WALL: 'shell_hit_wall',
    APPEARING: 'appearing',
    VISIBLE: 'visible',
    DISAPPEARING: 'disappearing',
    INVISIBLE: 'invisible',
    STUNNED: 'stunned',
    BLINKING: 'blinking',
    WARNING: 'warning',
    SLAMMING: 'slamming',
    SLAMMED: 'slammed',
    RETRACTING: 'retracting',
    ACTIVATING: 'activating',
    DEACTIVATING: 'deactivating',
    ATTACKING: 'attacking',
    RETURNING: 'returning'
});

export const ANIMATION_STATES = Object.freeze({
    IDLE: 'idle',
    IDLE1: 'idle1',
    IDLE2: 'idle2',
    IDLE_RUN: 'idle_run',
    RUN: 'run',
    JUMP: 'jump',
    DOUBLE_JUMP: 'double_jump',
    FALL: 'fall',
    DASH: 'dash',
    CLING: 'cling',
    SPAWN: 'spawn',
    DESPAWN: 'despawn',
    HIT: 'hit',
    HIT1: 'hit1',
    HIT2: 'hit2',
    FLYING: 'flying',
    GROUND: 'ground',
    APPEAR: 'appear',
    DISAPPEAR: 'disappear',
    WALK: 'walk',
    SHELL_IDLE: 'shell_idle',
    SHELL_WALL_HIT: 'shell_wall_hit',
    SHELL_TOP_HIT: 'shell_top_hit',
    SPIKES_OUT: 'spikes_out',
    SPIKES_IN: 'spikes_in',
    CEILING_IN: 'ceiling_in',
    CEILING_OUT: 'ceiling_out',
    ATTACK: 'attack',
    WALL_HIT: 'wall_hit',
    'hit_wall_1': 'hit_wall_1',
    'hit_wall_2': 'hit_wall_2',
});

export const EVENTS = Object.freeze({

    REQUEST_START_GAME: 'requestStartGame',
    REQUEST_LEVEL_LOAD: 'requestLevelLoad',
    REQUEST_NEXT_LEVEL: 'requestNextLevel',
    REQUEST_PREVIOUS_LEVEL: 'requestPreviousLevel',
    REQUEST_LEVEL_RESTART: 'requestLevelRestart',
    LEVEL_LOADED: 'levelLoaded',
    GAME_STARTED: 'gameStarted',
    GAME_PAUSED: 'gamePaused',
    GAME_RESUMED: 'gameResumed',
    LEVEL_COMPLETE: 'levelComplete',

    PLAYER_DIED: 'playerDied',
    PLAYER_TOOK_DAMAGE: 'playerTookDamage',
    PLAYER_KNOCKBACK: 'playerKnockback',
    PLAYER_LANDED_HARD: 'playerLandedHard',
    PLAYER_RESPAWNED: 'playerRespawned',

    FRUIT_COLLECTED: 'fruitCollected',
    CHECKPOINT_ACTIVATED: 'checkpointActivated',
    COLLISION_EVENT: 'collisionEvent',
    ENEMY_STOMPED: 'enemyStomped',

    SPAWN_BULLET: 'spawnBullet',
    CREATE_PARTICLES: 'createParticles',
    CREATE_DAMAGE_INDICATOR: 'createDamageIndicator',
    CREATE_SLIME_PUDDLE: 'createSlimePuddle',
    QUICK_RESPAWN_REQUESTED: 'quickRespawnRequested',
    SPAWN_GHOST_TRAIL: 'spawnGhostTrail',

    CAMERA_SHAKE_REQUESTED: 'cameraShakeRequested',
    KEYBINDS_UPDATED: 'keybindsUpdated',
    GAME_STATE_UPDATED: 'gameStateUpdated',
    CHARACTER_UPDATED: 'characterUpdated',
    ASSETS_LOADED: 'assetsLoaded',
    DELETE_DIY_LEVEL: 'deleteDIYLevel',

    PLAY_SOUND: 'playSound',
    START_SOUND_LOOP: 'startSoundLoop',
    STOP_SOUND_LOOP: 'stopSoundLoop',
    SOUND_SETTINGS_CHANGED: 'soundSettingsChanged',
    TOGGLE_SOUND: 'toggleSound',
    SET_SOUND_VOLUME: 'setSoundVolume',

    UI_BUTTON_CLICKED: 'ui_button_clicked',
    STATS_UPDATED: 'statsUpdated',
    MENU_OPENED: 'menuOpened',
    ALL_MENUS_CLOSED: 'allMenusClosed',
    ACTION_CONFIRM_PRESSED: 'action_confirm_pressed',
    ACTION_RESTART: 'action_restart',
    ACTION_NEXT: 'action_next',
    ACTION_PREVIOUS: 'action_previous',
    ACTION_ESCAPE_PRESSED: 'action_escape_pressed'
});

export const EDITOR_TOOL_TYPES = Object.freeze({
    PAINT: 'eraser',
    PLACE: 'place',
    SELECT: 'select',
    PASTE: 'paste',
    NONE: 'none'
});

export const PARTICLE_CONFIGS = {
    dash: { count: 8, baseSpeed: 180, spriteKey: 'dust_particle', life: 0.5, gravity: 50, size: 12 },
    double_jump: { count: 12, baseSpeed: 120, spriteKey: 'dust_particle', life: 0.5, gravity: 50, size: 12 },
    sand: { count: 4, baseSpeed: 30, spriteKey: 'sand_particle', life: 0.6, gravity: 120, size: 8 },
    mud: { count: 4, baseSpeed: 25, spriteKey: 'mud_particle', life: 0.7, gravity: 100, size: 8 },
    mud_splash: { count: 15, baseSpeed: 220, spriteKey: 'mud_particle', life: 0.9, gravity: 400, size: 10 },
    ice: { count: 5, baseSpeed: 100, spriteKey: 'ice_particle', life: 0.7, gravity: 250, size: 8 },
    walk_dust: { count: 2, baseSpeed: 20, spriteKey: 'dust_particle', life: 0.5, gravity: 80, size: 10 },
    enemy_walk_dust: { count: 3, baseSpeed: 25, spriteKey: 'dust_particle', life: 0.6, gravity: 40, size: 10 },
    jump_trail: { count: 2, baseSpeed: 15, spriteKey: 'dust_particle', life: 0.4, gravity: 20, size: 8 },
    fan_push: { count: 4, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.8, gravity: 0, size: 10 },
    enemy_death: { count: 20, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.7, gravity: 150, size: 14 },
    
    slime_puddle: { count: 1, baseSpeed: 0, spriteKey: 'slime_particles', life: 3.0, gravity: 0, animation: { frameCount: 4, frameSpeed: 0.2 } },
    ghost_particles: { count: 1, baseSpeed: 20, spriteKey: 'ghost_particles', life: 2.0, gravity: 0, animation: { frameCount: 4, frameSpeed: 0.1 }, size: 24 },
    snail_flee: { count: 1, baseSpeed: 250, spriteKey: 'snail_die', life: 1.5, gravity: 800, size: 38 },
    wing_flap: { count: 1, baseSpeed: 40, spriteKey: 'dust_particle', life: 0.3, gravity: 30, size: 10 },
    radish_leaf: { count: 1, baseSpeed: 120, spriteKey: 'radish_leaves', life: 0.8, gravity: 200, size: 16 },
    bee_bullet_pieces: { count: 1, baseSpeed: 120, spriteKey: 'bee_bullet_pieces', life: 0.8, gravity: 200, size: 16 },
    plant_bullet_pieces: { count: 1, baseSpeed: 120, spriteKey: 'plant_bullet_pieces', life: 0.8, gravity: 200, size: 16 },
    trunk_bullet_pieces: { count: 1, baseSpeed: 120, spriteKey: 'trunk_bullet_pieces', life: 0.8, gravity: 200, size: 16 },
    
    // Cosmetics - Dash Trails
    default_dash: { count: 8, baseSpeed: 180, spriteKey: 'dust_particle', life: 0.5, gravity: 50, size: 12 },
    phantom_dash: { count: 0 },
    rainbow_dash: { count: 3, baseSpeed: 50, spriteKey: 'dust_particle', life: 0.5, gravity: 20, behavior: 'rainbow' },
    leaf_dash: { count: 4, baseSpeed: 100, spriteKey: 'radish_leaves', life: 0.6, gravity: 30, size: 14 },
    fiery_comet_dash: { count: 8, baseSpeed: 100, spriteKey: 'dust_particle', life: 0.5, gravity: -40, color: [1.0, 0.2, 0.0, 0.8], size: 16, behavior: 'fire' },
    starfall_dash: { count: 5, baseSpeed: 40, spriteKey: 'dust_particle', life: 0.8, gravity: 20, size: 8, color: [0.8, 0.8, 1.0, 0.9], behavior: 'starfall', fadeOut: false },
    
    // Cosmetics - Death Effects
    default_death: { count: 25, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.8, gravity: 150, size: 14 },
    shatter_death: { count: 40, baseSpeed: 250, spriteKey: 'dust_particle', life: 1.0, gravity: 300, size: 12, behavior: 'random_color' },
    ascension_death: { count: 40, baseSpeed: 40, spriteKey: 'dust_particle', life: 1.5, gravity: -150, color: [0.5, 1.0, 1.0, 0.9], size: 12 },
    implosion_death: { count: 50, baseSpeed: -200, spriteKey: 'dust_particle', life: 0.8, gravity: 0, color: [0.2, 0.0, 0.3, 1.0], behavior: 'implosion', size: 16 },
    
    impact_yellow: { count: 1, baseSpeed: 0, spriteKey: 'impact_yellow', life: 8 * 0.08, gravity: 0, size: 96, animation: { frameCount: 8, frameSpeed: 0.08 }, fadeOut: false },
    lightning_burst_violet: { count: 1, baseSpeed: 0, spriteKey: 'lightning_burst_violet', life: 10 * 0.06, gravity: 0, size: 48, animation: { frameCount: 10, frameSpeed: 0.06 }, fadeOut: false },
    sparkle_burst_blue: { count: 1, baseSpeed: 0, spriteKey: 'sparkle_burst_blue', life: 14 * 0.05, gravity: 0, size: 32, animation: { frameCount: 14, frameSpeed: 0.05 }, fadeOut: false },
    spark_burst_yellow: { count: 1, baseSpeed: 0, spriteKey: 'spark_burst_yellow', life: 12 * 0.06, gravity: 0, size: 64, animation: { frameCount: 12, frameSpeed: 0.06 }, fadeOut: false },
    skull_burst_white: { count: 1, baseSpeed: 0, spriteKey: 'skull_burst_white', life: 12 * 0.06, gravity: 0, size: 64, animation: { frameCount: 12, frameSpeed: 0.06 }, fadeOut: false },
    smoke_burst_brown: { count: 1, baseSpeed: 0, spriteKey: 'smoke_burst_brown', life: 10 * 0.06, gravity: 0, size: 32, animation: { frameCount: 10, frameSpeed: 0.06 }, fadeOut: false },
    spell_death_red: { count: 1, baseSpeed: 0, spriteKey: 'spell_death_red', life: 50 * 0.02, gravity: 0, size: 64, animation: { frameCount: 50, frameSpeed: 0.02 }, fadeOut: false },

    // Cosmetics - Auras
    supercharge_aura: { count: 1, baseSpeed: 100, spriteKey: 'dust_particle', life: 0.5, gravity: -150, color: [1.0, 0.8, 0.1, 0.8], size: 16 },
    orbit_node: { count: 1, baseSpeed: 0, spriteKey: 'dust_particle', life: 0.15, gravity: 0, color: [0.0, 1.0, 1.0, 1.0], size: 12 },
    bubble_shield_base: { count: 1, baseSpeed: 0, spriteKey: 'dust_particle', life: 0.15, gravity: 0, size: 42, color: [0.4, 0.8, 1.0, 0.6], shape: 0.0 },
    bubble_trail: { count: 1, baseSpeed: 20, spriteKey: 'dust_particle', life: 0.4, gravity: -20, size: 8, color: [0.5, 0.8, 1.0, 0.6] },
    radiant_ray: { count: 2, baseSpeed: 60, spriteKey: 'dust_particle', life: 0.4, gravity: 0, size: 6, color: [0.95, 0.95, 1.0, 0.8], shape: 1.0, fadeOut: true }
};

export const COSMETICS = {
    dash: [
        { id: 'default_dash', name: 'Default', cost: 0, preview: { type: 'dash', particle: 'default_dash' } },
        { id: 'phantom_dash', name: 'Phantom', cost: 50, preview: { type: 'dash', ghost: true } },
        { id: 'rainbow_dash', name: 'Rainbow', cost: 75, preview: { type: 'dash', particle: 'rainbow_dash' } },
        { id: 'leaf_dash', name: 'Leaf Swirl', cost: 75, preview: { type: 'dash', particle: 'leaf_dash' } },
        { id: 'fiery_comet_dash', name: 'Fiery Comet', cost: 100, preview: { type: 'dash', particle: 'fiery_comet_dash' } },
        { id: 'starfall_dash', name: 'Starfall', cost: 125, preview: { type: 'dash', particle: 'starfall_dash' } }
    ],
    death: [
        { id: 'default_death', name: 'Default', cost: 0, preview: { type: 'death', particle: 'default_death' } },
        { id: 'shatter_death', name: 'Shatter', cost: 50, preview: { type: 'death', particle: 'shatter_death' } },
        { id: 'implosion_death', name: 'Implosion', cost: 75, preview: { type: 'death', particle: 'implosion_death' } },
        { id: 'ascension_death', name: 'Ascension', cost: 90, preview: { type: 'death', particle: 'ascension_death' } },
        { id: 'impact_yellow', name: 'Yellow Impact', cost: 100, preview: { type: 'death', particle: 'impact_yellow' } },
        { id: 'lightning_burst_violet', name: 'Violet Lightning', cost: 125, preview: { type: 'death', particle: 'lightning_burst_violet' } },
        { id: 'sparkle_burst_blue', name: 'Blue Sparkle', cost: 150, preview: { type: 'death', particle: 'sparkle_burst_blue' } },
        { id: 'spark_burst_yellow', name: 'Yellow Spark', cost: 150, preview: { type: 'death', particle: 'spark_burst_yellow' } },
        { id: 'skull_burst_white', name: 'White Skull', cost: 200, preview: { type: 'death', particle: 'skull_burst_white' } },
        { id: 'smoke_burst_brown', name: 'Brown Smoke', cost: 100, preview: { type: 'death', particle: 'smoke_burst_brown' } },
        { id: 'spell_death_red', name: 'Red Spell', cost: 250, preview: { type: 'death', particle: 'spell_death_red' } }
    ],
    aura: [
        { id: 'default_aura', name: 'None', cost: 0, auraConfig: null, preview: { type: 'aura' } },
        { id: 'orbiting_aura', name: 'Orbiting', cost: 75, auraConfig: { orbiting: true, emitRate: 0.02 }, preview: { type: 'aura' } },
        { id: 'supercharge_aura', name: 'Supercharge', cost: 100, auraConfig: { particleType: 'supercharge_aura', emitRate: 0.05 }, preview: { type: 'aura' } },
        { id: 'shadow_aura', name: 'Shadow', cost: 125, auraConfig: { ghostTrail: true, emitRate: 0.08 }, preview: { type: 'aura' } },
        { id: 'bubble_shield_aura', name: 'Bubble Shield', cost: 150, auraConfig: { bubbleShield: true, emitRate: 0.05 }, preview: { type: 'aura' } },
        { id: 'radiant_glow_aura', name: 'Radiant Glow', cost: 200, auraConfig: { radiantGlow: true, emitRate: 0.08 }, preview: { type: 'aura' } }
    ],
    mutator: [
        { id: 'default_mutator', name: 'None', cost: 0, modifiers: {}, preview: { type: 'mutator', speed: 4, amp: 5 }, description: "No mutator applied." },
        { id: 'featherweight_mutator', name: 'Featherweight', cost: 150, modifiers: { gravityMult: 0.7, damageTakenMult: 2.0 }, preview: { type: 'mutator', speed: 6, amp: 15 }, description: "Gravity is reduced, but you take double damage." },
        { id: 'overclock_mutator', name: 'Overclock', cost: 200, modifiers: { timeScale: 1.25 }, preview: { type: 'mutator', speed: 15, amp: 5 }, description: "Game speed is increased by 25%." },
        { id: 'pacifist_mutator', name: 'Pacifist', cost: 250, modifiers: { pacifist: true, coinMultiplier: 2.0 }, preview: { type: 'mutator', speed: 4, amp: 5 }, description: "Cannot stomp enemies. Fruit coins are doubled." },
        { id: 'glass_cannon_mutator', name: 'Glass Cannon', cost: 300, modifiers: { speedMult: 1.4, jumpForceMult: 1.25, maxHealth: 1 }, preview: { type: 'mutator', speed: 20, amp: 2 }, description: "Move and jump much faster, but any damage is fatal." },
        { id: 'bouncy_world_mutator', name: 'Bouncy World', cost: 200, modifiers: { bouncyWorld: true }, preview: { type: 'mutator', speed: 8, amp: 10 }, description: "Automatically bounce whenever you hit the ground." },
        { id: 'lunar_cycle_mutator', name: 'Lunar Cycle', cost: 250, modifiers: { lunarCycle: true }, preview: { type: 'mutator', speed: 2, amp: 20 }, description: "Gravity constantly shifts between very light and very heavy." }
    ]
};