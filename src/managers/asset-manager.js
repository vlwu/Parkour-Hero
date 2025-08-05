import { levelSections } from '../entities/level-definitions.js';


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


function loadImage(src, key) {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = 10000;

    let fallbackUsed = false;

    const createFallback = () => {
      if (fallbackUsed) return;
      fallbackUsed = true;
      console.warn(`Failed or timed out loading image: ${src}. Using fallback.`);
      let color = '#808080';
      if (key.includes('player')) color = '#ff8c21';
      else if (key.includes('fruit')) color = '#FF6B6B';
      const fallbackCanvas = createFallbackCanvas(32, 32, color);
      const fallbackImage = new Image();
      fallbackImage.src = fallbackCanvas.toDataURL();
      fallbackImage.onload = () => resolve(fallbackImage);
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


function loadJSON(path) {
  return fetch(path).then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch level: ${path}, status: ${response.status}`);
    }
    return response.json();
  }).catch(error => {
    console.error(`Error loading JSON from ${path}:`, error);
    return null;
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

const coreImagePaths = {
    font_spritesheet: '/assets/Menu/Text/Text (White) (8x10).png',
    settings_icon: '/assets/Menu/Buttons/Settings.png',
    pause_icon: '/assets/Menu/Buttons/Pause.png',
    play_icon: '/assets/Menu/Buttons/Play.png',
    levels_icon: '/assets/Menu/Buttons/Levels.png',
    character_icon: '/assets/Menu/Buttons/Character.png',
    info_icon: '/assets/Menu/Buttons/Info.png',
    editor_icon: '/assets/Menu/Buttons/Editor.png',
    transition: '/assets/Other/Transition.png',
};

const gameplayImagePaths = {
    background_blue: '/assets/Background/Blue.png',
    background_brown: '/assets/Background/Brown.png',
    background_gray: '/assets/Background/Gray.png',
    background_green: '/assets/Background/Green.png',
    background_pink: '/assets/Background/Pink.png',
    background_purple: '/assets/Background/Purple.png',
    background_red: '/assets/Background/Red.png',
    background_yellow: '/assets/Background/Yellow.png',
    block: '/assets/Terrain/Terrain.png',
    playerAppear: '/assets/MainCharacters/Appearing.png',
    playerDisappear: '/assets/MainCharacters/Disappearing.png',
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
    rh_blink: '/assets/Traps/Rock Head/Blink.png',
    rh_idle: '/assets/Traps/Rock Head/Idle.png',
    rh_bottom_hit: '/assets/Traps/Rock Head/Bottom Hit.png',
    sh_blink: '/assets/Traps/Spike Head/Blink.png',
    sh_idle: '/assets/Traps/Spike Head/Idle.png',
    sh_bottom_hit: '/assets/Traps/Spike Head/Bottom Hit.png',
    sand_mud_ice: '/assets/Traps/Sand Mud Ice/Sand Mud Ice.png',
    trampoline_idle: '/assets/Traps/Trampoline/Idle.png',
    trampoline_jump: '/assets/Traps/Trampoline/Jump.png',
    platform_brown_off: '/assets/Traps/Platforms/Brown Off.png',
    platform_brown_on: '/assets/Traps/Platforms/Brown On.png',
    platform_grey_off: '/assets/Traps/Platforms/Grey Off.png',
    platform_grey_on: '/assets/Traps/Platforms/Grey On.png',
    platform_chain: '/assets/Traps/Platforms/Chain.png',

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
    bee_hit: '/assets/Enemies/Bee/Hit.png',
    bee_attack: '/assets/Enemies/Bee/Attack.png',
    bee_idle: '/assets/Enemies/Bee/Idle.png',
    bee_bullet: '/assets/Enemies/Bee/Bullet.png',
    bee_bullet_pieces: '/assets/Enemies/Bee/Bullet Pieces.png',
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
    bat_ceiling_in: '/assets/Enemies/Bat/Ceiling In.png',
    bat_ceiling_out:'/assets/Enemies/Bat/Ceiling Out.png',
    bat_flying: '/assets/Enemies/Bat/Flying.png',
    ghost_hit: '/assets/Enemies/Ghost/Hit.png',
    ghost_idle: '/assets/Enemies/Ghost/Idle.png',
    ghost_appear: '/assets/Enemies/Ghost/Appear.png',
    ghost_disappear: '/assets/Enemies/Ghost/Disappear.png',
    ghost_particles: '/assets/Enemies/Ghost/Ghost Particles.png',
    rhino_hit: '/assets/Enemies/Rhino/Hit.png',
    rhino_idle: '/assets/Enemies/Rhino/Idle.png',
    rhino_run: '/assets/Enemies/Rhino/Run.png',
    rhino_wall_hit: '/assets/Enemies/Rhino/Wall Hit.png',
    plant_hit: '/assets/Enemies/Plant/Hit.png',
    plant_attack: '/assets/Enemies/Plant/Attack.png',
    plant_idle: '/assets/Enemies/Plant/Idle.png',
    plant_bullet: '/assets/Enemies/Plant/Bullet.png',
    plant_bullet_pieces: '/assets/Enemies/Plant/Bullet Pieces.png',
    trunk_hit: '/assets/Enemies/Trunk/Hit.png',
    trunk_idle: '/assets/Enemies/Trunk/Idle.png',
    trunk_run: '/assets/Enemies/Trunk/Run.png',
    trunk_attack: '/assets/Enemies/Trunk/Attack.png',
    trunk_bullet: '/assets/Enemies/Trunk/Bullet.png',
    trunk_bullet_pieces: '/assets/Enemies/Trunk/Bullet Pieces.png',
    angrypig_hit1: '/assets/Enemies/AngryPig/Hit 1.png',
    angrypig_hit2: '/assets/Enemies/AngryPig/Hit 2.png',
    angrypig_idle: '/assets/Enemies/AngryPig/Idle.png',
    angrypig_run: '/assets/Enemies/AngryPig/Run.png',
    angrypig_walk: '/assets/Enemies/AngryPig/Walk.png',
    chameleon_hit: '/assets/Enemies/Chameleon/Hit.png',
    chameleon_idle: '/assets/Enemies/Chameleon/Idle.png',
    chameleon_run: '/assets/Enemies/Chameleon/Run.png',
    chameleon_attack: '/assets/Enemies/Chameleon/Attack.png',
    rock1_hit: '/assets/Enemies/Rocks/Rock1 Hit.png',
    rock1_idle: '/assets/Enemies/Rocks/Rock1 Idle.png',
    rock1_run: '/assets/Enemies/Rocks/Rock1 Run.png',
    rock2_hit: '/assets/Enemies/Rocks/Rock2 Hit.png',
    rock2_idle: '/assets/Enemies/Rocks/Rock2 Idle.png',
    rock2_run: '/assets/Enemies/Rocks/Rock2 Run.png',
    rock3_hit: '/assets/Enemies/Rocks/Rock3 Hit.png',
    rock3_idle: '/assets/Enemies/Rocks/Rock3 Idle.png',
    rock3_run: '/assets/Enemies/Rocks/Rock3 Run.png',
    skull_hit: '/assets/Enemies/Skull/Hit.png',
    skull_hit_wall_1: '/assets/Enemies/Skull/Hit Wall 1.png',
    skull_hit_wall_2: '/assets/Enemies/Skull/Hit Wall 2.png',
    skull_idle1: '/assets/Enemies/Skull/Idle 1.png',
    skull_idle2: '/assets/Enemies/Skull/Idle 2.png',
    skull_orange_particle: '/assets/Enemies/Skull/Orange Particle.png',
    skull_red_particle: '/assets/Enemies/Skull/Red Particle.png',

    dust_particle: '/assets/Other/Dust Particle.png',
    ice_particle: '/assets/Traps/Sand Mud Ice/Ice Particle.png',
    sand_particle: '/assets/Traps/Sand Mud Ice/Sand Particle.png',
    mud_particle: '/assets/Traps/Sand Mud Ice/Mud Particle.png',
};

const coreSoundPaths = {
    button_click: '/assets/Sounds/Button Click.mp3',
};

const gameplaySoundPaths = {
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
    mud_splat: '/assets/Sounds/Mud Splat.mp3',
    ice_run: '/assets/Sounds/Ice Run.mp3',
    trampoline_bounce: '/assets/Sounds/Boing.mp3',
    fire_activated: '/assets/Sounds/Fire (Activated).mp3',
    arrow_pop: '/assets/Sounds/Arrow Pop.mp3',
    fan_blowing: '/assets/Sounds/Fan Blowing.mp3',
    rh_slam: '/assets/Sounds/RH Slam.mp3',
    sh_slam: '/assets/Sounds/SH Slam.mp3',
    snail_wall_hit: '/assets/Sounds/Snail Wall Hit.mp3',
    spawned: '/assets/Sounds/Spawned.mp3',
    wing_flap: '/assets/Sounds/Wing Flap.mp3',
    ghost: '/assets/Sounds/Ghost.mp3',
    rhino_charge: '/assets/Sounds/Rhino Charge.mp3',
    rhino_crash: '/assets/Sounds/Rhino Crash.mp3',
    bullet_shoot: '/assets/Sounds/Bullet Shoot.mp3',
    bullet_break: '/assets/Sounds/Bullet Break.mp3',
    skull_ignite: '/assets/Sounds/Skull Ignite.mp3'
};

export const coreSoundKeys = Object.keys(coreSoundPaths);
export const gameplaySoundKeys = Object.keys(gameplaySoundPaths);

class AssetManager {
    constructor() {
        this.assets = { characters: {} };
        this.gameplayAssetsLoaded = false;
    }

    async _loadAssetGroup(imagePaths, soundPaths, characterPaths = null) {
        const imagePromises = Object.entries(imagePaths).map(([key, src]) =>
            loadImage(src, key).then(img => ({ [key]: img }))
        );
        const soundPromises = Object.entries(soundPaths).map(([key, src]) =>
            loadSound(src, key).then(audio => ({ [key]: audio }))
        );

        const characterPromises = [];
        if (characterPaths) {
            for (const charKey in characterPaths) {
                if (!this.assets.characters[charKey]) {
                    this.assets.characters[charKey] = {};
                }
                for (const spriteKey in playerSpriteFiles) {
                    const fullPath = characterPaths[charKey].path + playerSpriteFiles[spriteKey];
                    const promise = loadImage(fullPath, `${charKey}-${spriteKey}`)
                        .then(img => ({ type: 'character', charKey, spriteKey, img }));
                    characterPromises.push(promise);
                }
            }
        }

        const loadedParts = await Promise.all([...imagePromises, ...soundPromises, ...characterPromises]);

        for (const part of loadedParts) {
            if (part.type === 'character') {
                this.assets.characters[part.charKey][part.spriteKey] = part.img;
            } else {
                Object.assign(this.assets, part);
            }
        }
    }

    async loadCoreAssets() {
        console.log("Loading core assets...");
        await this._loadAssetGroup(coreImagePaths, coreSoundPaths, characterData);
        console.log("Core assets loaded.");
        return this.assets;
    }

    async loadGameplayAssets() {
        if (this.gameplayAssetsLoaded) return;
        console.log("Loading gameplay assets for the first time...");
        await this._loadAssetGroup(gameplayImagePaths, gameplaySoundPaths);
        this.gameplayAssetsLoaded = true;
        console.log("Gameplay assets loaded.");
    }
}

export const assetManager = new AssetManager();