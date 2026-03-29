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

export const COSMETICS = {
    dash: [
        { id: 'default_dash', name: 'Default', cost: 0 },
        { id: 'phantom_dash', name: 'Phantom', cost: 50 },
        { id: 'rainbow_dash', name: 'Rainbow', cost: 75 },
        { id: 'leaf_dash', name: 'Leaf Swirl', cost: 75 }
    ],
    death: [
        { id: 'default_death', name: 'Default', cost: 0 },
        { id: 'shatter_death', name: 'Shatter', cost: 100 },
        { id: 'ascension_death', name: 'Ascension', cost: 125 },
        { id: 'implosion_death', name: 'Implosion', cost: 125 }
    ],
    aura: [
        { id: 'default_aura', name: 'None', cost: 0 },
        { id: 'supercharge_aura', name: 'Supercharge', cost: 150 },
        { id: 'shadow_aura', name: 'Shadow', cost: 150 },
        { id: 'orbiting_aura', name: 'Orbiting', cost: 200 }
    ],
    mutator: [
        { id: 'default_mutator', name: 'None', cost: 0 },
        { id: 'featherweight_mutator', name: 'Featherweight', cost: 200 },
        { id: 'overclock_mutator', name: 'Overclock', cost: 250 },
        { id: 'pacifist_mutator', name: 'Pacifist', cost: 300 }
    ]
};