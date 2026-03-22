import { eventBus } from '../utils/event-bus.js';
import { StorageManager } from './storage-manager.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { TILESET_ASSETS } from '../entities/tile-definitions.js';

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

async function loadSound(src, key) {
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (e) {
    console.warn(`Failed loading sound: ${src}. Using empty ArrayBuffer.`, e);
    return new ArrayBuffer(0);
  }
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

class AssetManager {
    constructor() {
        this.assets = { characters: {} };
        this.gameplayAssetsLoaded = false;
        this.manifest = null;
        this.coreSoundKeys = [];
        this.gameplaySoundKeys = [];
    }

    async _fetchManifest() {
        if (this.manifest) return;
        try {
            const response = await fetch('/asset-manifest.json');
            if (!response.ok) throw new Error('Could not load asset manifest');
            this.manifest = await response.json();
            this.coreSoundKeys = Object.keys(this.manifest.coreSounds || {});
            this.gameplaySoundKeys = Object.keys(this.manifest.gameplaySounds || {});
        } catch (error) {
            console.error('Failed to fetch asset manifest:', error);
            this.manifest = { coreImages: {}, coreSounds: {}, gameplayImages: {}, gameplaySounds: {}, characters: {} };
        }
    }

    async _loadAssetGroup(imagePaths, soundPaths, characterPaths = null) {
        const imagePromises = Object.entries(imagePaths).map(([key, src]) =>
            loadImage(src, key).then(img => ({ [key]: img }))
        );
        const soundPromises = Object.entries(soundPaths).map(([key, src]) =>
            loadSound(src, key).then(buffer => ({ [key]: buffer }))
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
        await this._fetchManifest();
        await this._loadAssetGroup(this.manifest.coreImages, this.manifest.coreSounds, this.manifest.characters);
        console.log("Core assets loaded.");
        return this.assets;
    }

    async loadGameplayAssets() {
        if (this.gameplayAssetsLoaded) return;
        console.log("Loading gameplay assets for the first time...");
        await this._fetchManifest();

        const dynamicImagePaths = { ...this.manifest.gameplayImages, ...TILESET_ASSETS };

        for (const def of Object.values(ENEMY_DEFINITIONS)) {
            if (def.assets) {
                Object.assign(dynamicImagePaths, def.assets);
            }
        }

        await this._loadAssetGroup(dynamicImagePaths, this.manifest.gameplaySounds);
        this.gameplayAssetsLoaded = true;
        console.log("Gameplay assets loaded.");
    }
}

export const assetManager = new AssetManager();