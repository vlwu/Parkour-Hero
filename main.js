import { Engine } from './src/core/engine.js';
import { loadAssets } from './src/managers/asset-manager.js';
import { eventBus } from './src/utils/event-bus.js';
import { FontRenderer } from './src/ui/font-renderer.js';
import './src/ui/ui-main.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gl = canvas.getContext('webgl2', { alpha: false }); // Request WebGL2 context

const uiRoot = document.getElementById('ui-root');

if (!canvas || !ctx || !gl) { // Check for WebGL2 context as well
  console.error('Canvas not found or a required context (2d, webgl2) is not available');
  document.body.innerHTML = '<h1>Error: Canvas or WebGL2 not supported</h1>';
  throw new Error('Canvas or WebGL2 not available');
}

ctx.imageSmoothingEnabled = false;

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

console.log(`Canvas initialized: ${BASE_WIDTH}x${BASE_HEIGHT}`);

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

    canvas.style.width = `${finalWidth}px`;
    canvas.style.height = `${finalHeight}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = left;
    canvas.style.top = top;

    if (uiRoot) {
        uiRoot.style.width = `${finalWidth}px`;
        uiRoot.style.height = `${finalHeight}px`;
        uiRoot.style.position = 'absolute';
        uiRoot.style.left = left;
        uiRoot.style.top = top;
        uiRoot.style.overflow = 'hidden';
    }


    console.log(`Canvas resized to: ${finalWidth}x${finalHeight} (display size)`);
  } catch (error) {
    console.error('Error resizing canvas:', error);
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function showLoadingIndicator() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);

  const barWidth = 300;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = canvas.height / 2 + 30;

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(barX, barY, barWidth * 0.1, barHeight);
}

showLoadingIndicator();

let keybinds = {
  moveLeft: 'a',
  moveRight: 'd',
  jump: 'w',
  dash: ' ',
};

let engine;

loadAssets().then((assets) => {
  console.log('Assets loaded successfully, preparing main menu...');

  try {
    const fontRenderer = new FontRenderer(assets.font_spritesheet);
    // Pass the new gl context to the engine
    engine = new Engine(ctx, gl, canvas, assets, keybinds, fontRenderer);

    eventBus.publish('assetsLoaded', assets);


    const uiRoot = document.querySelector('parkour-hero-ui');
    if (uiRoot) {
        uiRoot.fontRenderer = fontRenderer;
    }

    eventBus.subscribe('requestStartGame', () => {
        engine.start();
    });

    window.unlockAllLevels = () => {
        if (engine && engine.gameState) {
            engine.gameState = engine.gameState.unlockAllLevels();
            eventBus.publish('gameStateUpdated', engine.gameState);
            console.log("All levels have been unlocked.");
        }
    };
    console.log('Developer command available: Type `unlockAllLevels()` in the console to unlock all levels.');

    window.resetProgress = () => {
        if (engine && engine.gameState) {
            engine.gameState = engine.gameState.resetProgress();
            engine.loadLevel(0, 0); // This will use the newly reset state
            console.log("Game progress has been reset.");
        }
    };
    console.log('Developer command available: Type `resetProgress()` in the console to reset all saved data.');

    console.log('Game is ready. Waiting for user to start from the main menu.');
  } catch (error) {
    console.error('Failed to start game engine:', error);

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Failed to Start', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 20);
  }

}).catch((error) => {
  console.error("Asset loading failed:", error);

  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'red';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Failed to Load Assets', canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 20);
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Game initialization started');
console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
console.log('Device pixel ratio:', window.devicePixelRatio);
console.log('User agent:', navigator.userAgent);