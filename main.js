import { Engine } from './src/core/engine.js';
import { assetManager } from './src/managers/asset-manager.js';
import { eventBus } from './src/utils/event-bus.js';
import { FontRenderer } from './src/ui/font-renderer.js';
import { gameStateManager } from './src/managers/game-state.js';
import './src/ui/ui-main.js';

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

let keybinds = {
  moveLeft: 'a',
  moveRight: 'd',
  jump: 'w',
  dash: ' ',
};

let engine;

assetManager.loadCoreAssets().then((assets) => {
  console.log('Core assets loaded successfully, preparing main menu...');

  try {
    const fontRenderer = new FontRenderer(assets.font_spritesheet);

    engine = new Engine(gl, uiCanvas, ctx, assets, keybinds, fontRenderer, assetManager);

    eventBus.publish('assetsLoaded', assets);
    eventBus.publish('gameStateReady', gameStateManager.getState());

    const uiRootEl = document.querySelector('parkour-hero-ui');
    if (uiRootEl) {
        uiRootEl.fontRenderer = fontRenderer;
    }

    window.unlockAllLevels = () => {
        gameStateManager.unlockAllLevels();
    };
    console.log('Developer command available: Type `unlockAllLevels()` in the console to unlock all levels.');

    window.resetProgress = () => {
        gameStateManager.resetProgress();
        engine.initiateLevelLoad(0, 0);
    };
    console.log('Developer command available: Type `resetProgress()` in the console to reset all saved data.');

    console.log('Game is ready. Waiting for user to start from the main menu.');
  } catch (error) {
    console.error('Failed to start game engine:', error);
  }

}).catch((error) => {
  console.error("Asset loading failed:", error);
});

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