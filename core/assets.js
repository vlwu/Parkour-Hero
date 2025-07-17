import { levelSections } from '../entities/levels.js';

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
    PinkMan: { path: 'assets/MainCharacters/PinkMan/' },
    NinjaFrog: { path: 'assets/MainCharacters/NinjaFrog/' },
    MaskDude: { path: 'assets/MainCharacters/MaskDude/' },
    VirtualGuy: { path: 'assets/MainCharacters/VirtualGuy/' },
};

const playerSpriteFiles = {
    playerJump: 'jump.png',
    playerDoubleJump: 'double_jump.png',
    playerIdle: 'idle.png',
    playerRun: 'run.png',
    playerFall: 'fall.png',
    playerDash: 'dash.png',
    playerCling: 'wall_jump.png',
};

export async function loadAssets() {
  const imagePaths = {
    // Canvas assets
    backgroundTile: 'assets/Background/Blue.png',
    block: 'assets/Terrain/Terrain.png',
    // Non-character-specific player sprites
    playerAppear: 'assets/MainCharacters/Appearing.png',
    playerDisappear: 'assets/MainCharacters/Disappearing.png',
    // Interactive items
    fruit_apple: 'assets/Items/Fruits/Apple.png',
    fruit_bananas: 'assets/Items/Fruits/Bananas.png',
    fruit_cherries: 'assets/Items/Fruits/Cherries.png',
    fruit_kiwi: 'assets/Items/Fruits/Kiwi.png',
    fruit_melon: 'assets/Items/Fruits/Melon.png',
    fruit_orange: 'assets/Items/Fruits/Orange.png',
    fruit_pineapple: 'assets/Items/Fruits/Pineapple.png',
    fruit_strawberry: 'assets/Items/Fruits/Strawberry.png',
    fruit_collected: 'assets/Items/Fruits/Collected.png',
    checkpoint_inactive: 'assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png',
    checkpoint_activation: 'assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png',
    checkpoint_active: 'assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png',
    trophy: 'assets/Items/Checkpoints/End/End (Pressed).png',
    // Traps
    spike_two: 'assets/Traps/Spikes/Two.png',
    fire_off: 'assets/Traps/Fire/off.png',
    fire_hit: 'assets/Traps/Fire/hit.png',
    fire_on: 'assets/Traps/Fire/on.png',
    sand_mud_ice: 'assets/Traps/Sand Mud Ice/Sand Mud Ice.png',
    trampoline_idle: 'assets/Traps/Trampoline/Idle.png',
    trampoline_jump: 'assets/Traps/Trampoline/Jump.png',
    // Menu assets
    next_level_button: 'assets/Menu/Buttons/Next.png',
    restart_level_button: 'assets/Menu/Buttons/Restart.png',
    previous_level_button: 'assets/Menu/Buttons/Previous.png',
    level_menu_button: 'assets/Menu/Buttons/Levels.png',
    resume_button: 'assets/Menu/Buttons/Play.png',
    settings_button: 'assets/Menu/Buttons/Settings.png',
    character_button: 'assets/Menu/Buttons/Character.png', 
    how_to_play_button: 'assets/Menu/Buttons/How To Play.png',
    // Other assets
    dust_particle: 'assets/Other/Dust Particle.png',
    ice_particle: 'assets/Traps/Sand Mud Ice/Ice Particle.png',
    sand_particle: 'assets/Traps/Sand Mud Ice/Sand Particle.png',
    mud_particle: 'assets/Traps/Sand Mud Ice/Mud Particle.png',
  };

  const soundPaths = {
    jump: 'assets/Sounds/Player Jump.mp3',
    double_jump: 'assets/Sounds/Player Double Jump.mp3',
    collect: 'assets/Sounds/Fruit Collect.mp3',
    level_complete: 'assets/Sounds/Level Complete.mp3',
    death_sound: 'assets/Sounds/Death.mp3',
    dash: 'assets/Sounds/Whoosh.mp3',
    checkpoint_activated: 'assets/Sounds/Checkpoint (Activation).mp3',
    sand_walk: 'assets/Sounds/Sand Walk.mp3',
    mud_run: 'assets/Sounds/Mud Run.mp3',
    ice_run: 'assets/Sounds/Ice Run.mp3',
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