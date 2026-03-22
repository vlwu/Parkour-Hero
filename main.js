import { Engine } from './src/core/engine.js';
import { assetManager } from './src/managers/asset-manager.js';
import { eventBus } from './src/utils/event-bus.js';
import { FontRenderer } from './src/ui/font-renderer.js';
import './src/ui/ui-main.js';
import { StorageManager } from './src/managers/storage-manager.js';
import { GameState } from './src/managers/game-state.js';

const gameCanvas = document.getElementById('gameCanvas');
const uiCanvas = document.getElementById('uiCanvas');
const uiRoot = document.getElementById('ui-root');

const gl = gameCanvas.getContext('webgl2', { alpha: true });
const ctx = uiCanvas.getContext('2d');

if (!gameCanvas || !uiCanvas || !ctx || !gl) {
  console.error('A required canvas or context is not available');
  document.body.innerHTML = '<h1>Error: Canvas or WebGL2 not supported</h1>';
  throw new Error('Canvas or WebGL2 not available');
}

ctx.imageSmoothingEnabled = false;

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

gameCanvas.width = BASE_WIDTH;
gameCanvas.height = BASE_HEIGHT;
uiCanvas.width = BASE_WIDTH;
uiCanvas.height = BASE_HEIGHT;

console.log(`Canvases initialized: ${BASE_WIDTH}x${BASE_HEIGHT}`);

function resizeCanvas() {
  try {
    const aspectRatio = 16 / 9;
    const windowRatio = window.innerWidth / window.innerHeight;
    let width, height;

    if (windowRatio > aspectRatio) {
      height = window.innerHeight;
      width = height * aspectRatio;
    } else {
      width = window.innerWidth;
      height = width / aspectRatio;
    }

    const finalWidth = Math.floor(width);
    const finalHeight = Math.floor(height);

    const left = `${(window.innerWidth - finalWidth) / 2}px`;
    const top = `${(window.innerHeight - finalHeight) / 2}px`;

    const elementsToResize = [gameCanvas, uiCanvas, uiRoot];
    elementsToResize.forEach(el => {
        if (el) {
            el.style.width = `${finalWidth}px`;
            el.style.height = `${finalHeight}px`;
            el.style.position = 'absolute';
            el.style.left = left;
            el.style.top = top;
        }
    });

    if (uiRoot) {
        uiRoot.style.overflow = 'hidden';
    }

    console.log(`Canvases resized to: ${finalWidth}x${finalHeight} (display size)`);
  } catch (error) {
    console.error('Error resizing canvas:', error);
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let engine;

async function initGame() {
    const settings = await StorageManager.loadSettings();
    let keybinds = settings.keybinds;
    let gameplaySettings = settings.gameplay;
    let soundSettings = settings.sound;

    const initialGameState = await GameState.load();

    assetManager.loadCoreAssets().then(async (assets) => {
        console.log('Core assets loaded successfully, preparing main menu...');

        try {
            const fontRenderer = new FontRenderer(assets.font_spritesheet);

            engine = new Engine(gl, uiCanvas, ctx, assets, keybinds, fontRenderer, assetManager, gameplaySettings, soundSettings);
            engine.gameState = initialGameState;

            eventBus.publish('assetsLoaded', assets);
            eventBus.publish('gameStateUpdated', initialGameState);

            const uiRootEl = document.querySelector('parkour-hero-ui');
            if (uiRootEl) {
                uiRootEl.fontRenderer = fontRenderer;
                uiRootEl.gameState = initialGameState;
                uiRootEl.keybinds = keybinds;
                uiRootEl.soundSettings = soundSettings;
                uiRootEl.gameplaySettings = gameplaySettings;
            }

            eventBus.subscribe('requestStartGame', () => {
                engine.start();
            });

            eventBus.subscribe('gameplaySettingsChanged', (newSettings) => {
                if (engine) {
                    engine.updateGameplaySettings(newSettings);
                }
            });

            await assetManager.loadGameplayAssets();
            engine.renderer.syncTextures();
            engine.particleSystem.syncTextures();
            await engine.soundManager.addSounds(assetManager.assets, [...assetManager.coreSoundKeys, ...assetManager.gameplaySoundKeys]);
            console.log("All gameplay assets are now loaded and ready.");

            window.unlockAllLevels = () => {
                if (engine && engine.gameState) {
                    engine.gameState = engine.gameState.unlockAllLevels();
                    eventBus.publish('gameStateUpdated', engine.gameState);
                    console.log("All levels have been unlocked.");
                }
            };
            console.log('Developer command available: Type `unlockAllLevels()` in the console to unlock all levels.');

            window.resetProgress = async () => {
                if (engine) {
                    const newState = await GameState.resetProgress();
                    engine.gameState = newState;
                    eventBus.publish('gameStateUpdated', newState);
                    engine.loadLevel(0, 0);
                    console.log("Game progress has been reset.");
                }
            };
            console.log('Developer command available: Type `resetProgress()` in the console to reset all saved data.');

            window.unlockSomeLevels = (count) => {
                if (engine && engine.gameState) {
                    try {
                        const newState = engine.gameState.unlockLevels(count);
                        engine.gameState = newState;
                        eventBus.publish('gameStateUpdated', newState);
                        console.log(`Unlocked ${count} levels.`);
                    } catch (e) {
                        console.error(e.message);
                    }
                }
            };
            console.log('Developer command available: Type `unlockSomeLevels(n)` in the console to unlock n levels.');

            console.log('Game is ready. Waiting for user to start from the main menu.');
        } catch (error) {
            console.error('Failed to start game engine:', error);
        }
    }).catch((error) => {
        console.error("Asset loading failed:", error);
    });
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Game initialization started');
console.log('Canvas dimensions:', gameCanvas.width, 'x', gameCanvas.height);
console.log('Device pixel ratio:', window.devicePixelRatio);
console.log('User agent:', navigator.userAgent);

initGame();