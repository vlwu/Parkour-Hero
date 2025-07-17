// PIXI MIGRATION: Replaced custom loaders with PIXI.Assets for optimized texture and sound management.

import { levelSections } from '../entities/levels.js';

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

// Fetches and parses a single JSON file (this function remains the same)
function loadJSON(path) {
  return fetch(path).then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch level: ${path}, status: ${response.status}`);
    }
    return response.json();
  }).catch(error => {
    console.error(`Error loading JSON from ${path}:`, error);
    return null; // Return null on failure
  });
}

export async function loadAssets() {
  console.log('Starting asset loading with PixiJS...');

  // PIXI MIGRATION: Define asset bundles for better organization
  const bundles = [
    { name: 'main-game', assets: {
        backgroundTile: 'assets/Background/Blue.png',
        block: 'assets/Terrain/Terrain.png',
        playerAppear: 'assets/MainCharacters/Appearing.png',
        playerDisappear: 'assets/MainCharacters/Disappearing.png',
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
        sand_mud_ice: 'assets/Traps/Sand Mud Ice/Sand Mud Ice.png',
        dust_particle: 'assets/Other/Dust Particle.png',
      }
    },
    { name: 'sounds', assets: {
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
      }
    }
  ];

  // Create bundles for each character
  for (const charKey in characterData) {
      const charAssets = {};
      for (const spriteKey in playerSpriteFiles) {
          const alias = `${charKey}_${spriteKey}`; // e.g., PinkMan_playerIdle
          charAssets[alias] = characterData[charKey].path + playerSpriteFiles[spriteKey];
      }
      bundles.push({ name: charKey, assets: charAssets });
  }

  // Initialize Pixi Assets with all our bundles
  await PIXI.Assets.init({ manifest: { bundles } });

  // Load level JSON data in parallel
  const levelDataPromises = levelSections.flatMap((section, sectionIndex) =>
      section.levels.map((level, levelIndex) => {
          if (level.jsonPath) {
              return loadJSON(level.jsonPath).then(data => {
                  if (data) {
                      levelSections[sectionIndex].levels[levelIndex] = data;
                  }
              });
          }
          return Promise.resolve();
      })
  );

  await Promise.all(levelDataPromises);
  console.log('All level JSON data loaded and processed.');

  // PIXI MIGRATION: Load all asset bundles simultaneously
  const allBundleNames = bundles.map(b => b.name);
  const assets = await PIXI.Assets.loadBundle(allBundleNames);

  console.log('All PixiJS assets loaded successfully.');
  return assets;
}