export const PLAYER_CONSTANTS = {
  // Dimensions
  WIDTH: 32,
  HEIGHT: 32,
  SPAWN_WIDTH: 96,
  SPAWN_HEIGHT: 96,
  CLING_OFFSET: 7,

  // Physics
  MOVE_SPEED: 200,      // pixels/s
  JUMP_FORCE: 400,      // upward velocity impulse
  GRAVITY: 1200,        // downward acceleration
  MAX_FALL_SPEED: 600,  // terminal velocity

  // Fall Damage
  FALL_DAMAGE_MIN_VELOCITY: 525, // vy threshold to start taking damage
  FALL_DAMAGE_MAX_VELOCITY: 650, // vy at which max damage is taken
  FALL_DAMAGE_MIN_AMOUNT: 8,     // min HP damage
  FALL_DAMAGE_MAX_AMOUNT: 20,    // max HP damage

  // Dash
  DASH_SPEED: 500,
  DASH_DURATION: 0.2,   // seconds
  DASH_COOLDOWN: 0.7,   // seconds

  // Timers
  COYOTE_TIME: 0.1,     // seconds
  JUMP_BUFFER_TIME: 0.15, // seconds
  HIT_STUN_DURATION: 0.2, // seconds

  // Surface Modifiers
  SAND_MOVE_MULTIPLIER: 0.5,
  MUD_JUMP_MULTIPLIER: 0.6,
  ICE_ACCELERATION: 800,
  ICE_FRICTION: 400,
  TRAMPOLINE_BOUNCE_MULTIPLIER: 2,

  // Animation
  ANIMATION_SPEED: 0.06,
  SPAWN_ANIMATION_SPEED: 0.08,
  HIT_ANIMATION_SPEED: 0.1,

  ANIMATION_FRAMES: {
    idle: 11,
    run: 12,
    double_jump: 6,
    jump: 1,
    fall: 1,
    dash: 1,
    cling: 5,
    spawn: 7,
    despawn: 7,
    hit: 7,
  }
};

export const GRID_CONSTANTS = {
  TILE_SIZE: 48,
};