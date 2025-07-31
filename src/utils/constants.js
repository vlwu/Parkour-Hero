export const PLAYER_CONSTANTS = {

  WIDTH: 32,
  HEIGHT: 32,
  SPAWN_WIDTH: 96,
  SPAWN_HEIGHT: 96,
  CLING_OFFSET: 7,


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