import { levelSections } from '../entities/level-definitions.js';

// Utility to create a fallback canvas for assets
function createFallbackCanvas(width, height, color, pattern = true) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  if (pattern) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width / 2, height / 2);
    ctx.fillRect(width / 2, height / 2, width / 2, height / 2);
  }
  return canvas;
}

// Loads a single image with a timeout and fallback
function loadImage(src, key) {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = 10000;

    let fallbackUsed = false;

    const createFallback = () => {
      if (fallbackUsed) return;
      fallbackUsed = true;
      console.warn(`Failed or timed out loading image: ${src}. Using fallback.`);
      let color = '#808080'; // Default grey
      if (key.includes('player')) color = '#ff8c21';
      else if (key.includes('fruit')) color = '#FF6B6B';
      const fallbackCanvas = createFallbackCanvas(32, 32, color);
      const fallbackImage = new Image();
      fallbackImage.src = fallbackCanvas.toDataURL();
      fallbackImage.onload = () => resolve(fallbackImage); // Resolve with the new fallback image
    };
    
    const timer = setTimeout(createFallback, timeout);

    img.onload = () => {
      if (fallbackUsed) return;
      clearTimeout(timer);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      createFallback();
    };

    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

// Loads a single sound with a timeout and fallback
function loadSound(src, key) {
  return new Promise((resolve) => {
    const audio = new Audio();
    const timeout = 10000;
    
    let fallbackUsed = false;
    
    const useFallback = () => {
        if (fallbackUsed) return;
        fallbackUsed = true;
        console.warn(`Failed or timed out loading sound: ${src}. Using silent fallback.`);
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        resolve(silentAudio);
    };

    const timer = setTimeout(useFallback, timeout);
    
    audio.addEventListener('canplaythrough', () => {
      if (fallbackUsed) return;
      clearTimeout(timer);
      resolve(audio);
    });

    audio.addEventListener('error', () => {
      clearTimeout(timer);
      useFallback();
    });

    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = src;
    audio.load();
  });
}

// Fetches and parses a single JSON file
function loadJSON(path) {
  return fetch(path).then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch level: ${path}, status: ${response.status}`);
    }
    return response.json();
  }).catch(error => {
    console.error(`Error loading JSON from ${path}:`, error);
    return null; // Return null on failure to prevent blocking other assets
  });
}

const characterData = {
    PinkMan: { path: '/assets/MainCharacters/PinkMan/' },
    NinjaFrog: { path: '/assets/MainCharacters/NinjaFrog/' },
    MaskDude: { path: '/assets/MainCharacters/MaskDude/' },
    VirtualGuy: { path: '/assets/MainCharacters/VirtualGuy/' },
};

const playerSpriteFiles = {
    playerJump: 'jump.png',
    playerDoubleJump: 'double_jump.png',
    playerIdle: 'idle.png',
    playerRun: 'run.png',
    playerFall: 'fall.png',
    playerDash: 'dash.png',
    playerCling: 'wall_jump.png',
    playerHit: 'hit.png',
};

export async function loadAssets() {
  const imagePaths = {
    // UI assets
    font_spritesheet: '/assets/Menu/Text/Text (White) (8x10).png',
    settings_icon: '/assets/Menu/Buttons/Settings.png',
    pause_icon: '/assets/Menu/Buttons/Pause.png',
    play_icon: '/assets/Menu/Buttons/Play.png',
    levels_icon: '/assets/Menu/Buttons/Levels.png',
    character_icon: '/assets/Menu/Buttons/Character.png',
    info_icon: '/assets/Menu/Buttons/Info.png',
    // Canvas assets
    background_blue: '/assets/Background/Blue.png',
    background_brown: '/assets/Background/Brown.png',
    background_gray: '/assets/Background/Gray.png',
    background_green: '/assets/Background/Green.png',
    background_pink: '/assets/Background/Pink.png',
    background_purple: '/assets/Background/Purple.png',
    background_red: '/assets/Background/Red.png',
    background_yellow: '/assets/Background/Yellow.png',
    block: '/assets/Terrain/Terrain.png',
    // Non-character-specific player sprites
    playerAppear: '/assets/MainCharacters/Appearing.png',
    playerDisappear: '/assets/MainCharacters/Disappearing.png',
    // Interactive items
    fruit_apple: '/assets/Items/Fruits/Apple.png',
    fruit_bananas: '/assets/Items/Fruits/Bananas.png',
    fruit_cherries: '/assets/Items/Fruits/Cherries.png',
    fruit_kiwi: '/assets/Items/Fruits/Kiwi.png',
    fruit_melon: '/assets/Items/Fruits/Melon.png',
    fruit_orange: '/assets/Items/Fruits/Orange.png',
    fruit_pineapple: '/assets/Items/Fruits/Pineapple.png',
    fruit_strawberry: '/assets/Items/Fruits/Strawberry.png',
    fruit_collected: '/assets/Items/Fruits/Collected.png',
    checkpoint_inactive: '/assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png',
    checkpoint_activation: '/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png',
    checkpoint_active: '/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png',
    trophy_idle: '/assets/Items/Checkpoints/End/End (Idle).png',
    trophy_pressed: '/assets/Items/Checkpoints/End/End (Pressed).png',
    // Traps
    spike_two: '/assets/Traps/Spikes/Two.png',
    fire_off: '/assets/Traps/Fire/off.png',
    fire_hit: '/assets/Traps/Fire/hit.png',
    fire_on: '/assets/Traps/Fire/on.png',
    spiked_ball_chain: '/assets/Traps/Spiked Ball/Chain.png', 
    spiked_ball: '/assets/Traps/Spiked Ball/Spiked Ball.png', 
    saw: '/assets/Traps/Saw/on.png', 
    saw_chain: '/assets/Traps/Saw/Chain.png', 
    fan_off: '/assets/Traps/Fan/Off.png',
    fan_on: '/assets/Traps/Fan/On.png',
    arrow_idle: '/assets/Traps/Arrow/Idle.png',
    arrow_hit: '/assets/Traps/Arrow/Hit.png',
    falling_platform_off: '/assets/Traps/Falling Platforms/Off.png',
    falling_platform_on: '/assets/Traps/Falling Platforms/On.png',
    rh_blink: '/assets/Traps/Rock Head/Blink.png', // RH stands for Rock Head
    rh_idle: '/assets/Traps/Rock Head/Idle.png',
    rh_bottom_hit: '/assets/Traps/Rock Head/Bottom Hit.png',
    sh_blink: '/assets/Traps/Spike Head/Blink.png', // SH stands for Spike Head
    sh_idle: '/assets/Traps/Spike Head/Idle.png',
    sh_bottom_hit: '/assets/Traps/Spike Head/Bottom Hit.png',
    sand_mud_ice: '/assets/Traps/Sand Mud Ice/Sand Mud Ice.png',
    trampoline_idle: '/assets/Traps/Trampoline/Idle.png',
    trampoline_jump: '/assets/Traps/Trampoline/Jump.png',
    // Enemies 
    mushroom_hit: '/assets/Enemies/Mushroom/Hit.png',
    mushroom_idle: '/assets/Enemies/Mushroom/Idle.png',
    mushroom_run: '/assets/Enemies/Mushroom/Run.png',

    chicken_hit: '/assets/Enemies/Chicken/Hit.png',
    chicken_idle: '/assets/Enemies/Chicken/Idle.png',
    chicken_run: '/assets/Enemies/Chicken/Run.png',

    snail_hit: '/assets/Enemies/Snail/Hit.png',
    snail_idle: '/assets/Enemies/Snail/Idle.png',
    snail_walk: '/assets/Enemies/Snail/Walk.png',
    snail_die: '/assets/Enemies/Snail/Snail without shell.png',
    snail_shell_idle: '/assets/Enemies/Snail/Shell Idle.png',
    snail_shell_top_hit: '/assets/Enemies/Snail/Shell Top Hit.png',
    snail_shell_wall_hit: '/assets/Enemies/Snail/Shell Wall Hit.png',

    slime_hit: '/assets/Enemies/Slime/Hit.png',
    slime_idle_run: '/assets/Enemies/Slime/Idle-Run.png',
    slime_particles: '/assets/Enemies/Slime/Particles.png',

    turtle_hit: '/assets/Enemies/Turtle/Hit.png',
    turtle_idle1: '/assets/Enemies/Turtle/Idle 1.png',
    turtle_idle2: '/assets/Enemies/Turtle/Idle 2.png',
    turtle_spikes_in: '/assets/Enemies/Turtle/Spikes in.png',
    turtle_spikes_out: '/assets/Enemies/Turtle/Spikes out.png',

    bee_hit : '/assets/Enemies/Bee/Hit.png',
    bee_attack : '/assets/Enemies/Bee/Attack.png',
    bee_idle : '/assets/Enemies/Bee/Idle.png',
    bee_bullet: '/assets/Enemies/Bee/Bullet.png',

    bluebird_flying: '/assets/Enemies/BlueBird/Flying.png',
    bluebird_hit: '/assets/Enemies/BlueBird/Hit.png',

    fatbird_hit: '/assets/Enemies/FatBird/Hit.png',
    fatbird_idle: '/assets/Enemies/FatBird/Idle.png',
    fatbird_fall: '/assets/Enemies/FatBird/Fall.png',
    fatbird_ground: '/assets/Enemies/FatBird/Ground.png',

    radish_hit: '/assets/Enemies/Radish/Hit.png',
    radish_idle1: '/assets/Enemies/Radish/Idle 1.png',
    radish_idle2: '/assets/Enemies/Radish/Idle 2.png',
    radish_leaves: '/assets/Enemies/Radish/Leaves.png',
    radish_run: '/assets/Enemies/Radish/Run.png',

    bat_hit: '/assets/Enemies/Bat/Hit.png',
    bat_idle: '/assets/Enemies/Bat/Idle.png',
    bat_flying: '/assets/Enemies/Bat/Flying.png',
    bat_ceiling_in: '/assets/Enemies/Bat/Ceiling In.png',
    bat_ceiling_out: '/assets/Enemies/Bat/Ceiling Out.png',
    // Other assets
    dust_particle: '/assets/Other/Dust Particle.png',
    ice_particle: '/assets/Traps/Sand Mud Ice/Ice Particle.png',
    sand_particle: '/assets/Traps/Sand Mud Ice/Sand Particle.png',
    mud_particle: '/assets/Traps/Sand Mud Ice/Mud Particle.png',
  };

  const soundPaths = {
    button_click: '/assets/Sounds/Button Click.mp3',
    jump: '/assets/Sounds/Player Jump.mp3',
    double_jump: '/assets/Sounds/Player Double Jump.mp3',
    collect: '/assets/Sounds/Fruit Collect.mp3',
    level_complete: '/assets/Sounds/Level Complete.mp3',
    trophy_activated: '/assets/Sounds/Trophy Activated.mp3',
    death_sound: '/assets/Sounds/Death.mp3',
    dash: '/assets/Sounds/Whoosh.mp3',
    checkpoint_activated: '/assets/Sounds/Checkpoint (Activation).mp3',
    hit: '/assets/Sounds/Hit.mp3',
    enemy_stomp: '/assets/Sounds/Enemy Stomp.mp3',
    sand_walk: '/assets/Sounds/Sand Walk.mp3',
    mud_run: '/assets/Sounds/Mud Run.mp3',
    ice_run: '/assets/Sounds/Ice Run.mp3',
    trampoline_bounce: '/assets/Sounds/Boing.mp3',
    fire_activated: '/assets/Sounds/Fire (Activated).mp3',
    arrow_pop: '/assets/Sounds/Arrow Pop.mp3',
    fan_blowing: '/assets/Sounds/Fan Blowing.mp3',
    rh_slam: '/assets/Sounds/RH Slam.mp3',
    sh_slam: '/assets/Sounds/SH Slam.mp3',
    falling_platform: '/assets/Sounds/Falling Platform Whirring.mp3',
    snail_wall_hit: '/assets/Sounds/Snail Wall Hit.mp3',
  };

  console.log('Starting asset loading...');

  // Create promises for regular images and sounds
  const regularImagePromises = Object.entries(imagePaths).map(([key, src]) => 
    loadImage(src, key).then(img => ({ [key]: img }))
  );
  const soundPromises = Object.entries(soundPaths).map(([key, src]) => 
    loadSound(src, key).then(audio => ({ [key]: audio }))
  );

  // Create promises for character-specific sprites
  const characterPromises = [];
  for (const charKey in characterData) {
    for (const spriteKey in playerSpriteFiles) {
        const fullPath = characterData[charKey].path + playerSpriteFiles[spriteKey];
        const promise = loadImage(fullPath, `${charKey}-${spriteKey}`)
            .then(img => ({ type: 'character', charKey, spriteKey, img }));
        characterPromises.push(promise);
    }
  }

  // Create promises to load level data from JSON files
  const levelDataPromises = [];
  levelSections.forEach((section, sectionIndex) => {
    section.levels.forEach((level, levelIndex) => {
      if (level.jsonPath) {
        levelDataPromises.push(
          loadJSON(level.jsonPath).then(data => ({
            data,
            sectionIndex,
            levelIndex,
            type: 'level'
          }))
        );
      }
    });
  });

  const allPromises = [...regularImagePromises, ...soundPromises, ...characterPromises, ...levelDataPromises];
  
  try {
    const loadedAssetParts = await Promise.all(allPromises);
    
    // Assemble the final assets object
    const assets = { characters: {} };
    for (const charKey in characterData) {
        assets.characters[charKey] = {};
    }

    for (const part of loadedAssetParts) {
        if (!part) continue; // Skip failed loads

        if (part.type === 'character') {
            assets.characters[part.charKey][part.spriteKey] = part.img;
        } else if (part.type === 'level') {
            // Hydrate the imported levelSections object with the fetched data.
            // This is a controlled side-effect that happens before the engine starts.
            levelSections[part.sectionIndex].levels[part.levelIndex] = part.data;
        } else {
            Object.assign(assets, part);
        }
    }
    
    console.log('All assets and level data processed. Available assets:', Object.keys(assets).length);
    return assets;
  } catch (error) {
    console.error('A critical error occurred during asset loading:', error);
    throw error;
  }
}