import { Engine } from './src/core/engine.js';
import { loadAssets } from './src/managers/asset-manager.js';
import { InputManager } from './src/systems/input-system.js';
import { MenuManager } from './src/ui/menu-manager.js';
import { eventBus } from './src/utils/event-bus.js';
import { FontRenderer } from './src/ui/font-renderer.js';

// Get canvas element and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Check if canvas is available
if (!canvas || !ctx) {
  console.error('Canvas not found or context not available');
  document.body.innerHTML = '<h1>Error: Canvas not supported</h1>';
  throw new Error('Canvas not available');
}

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

console.log(`Canvas initialized: ${BASE_WIDTH}x${BASE_HEIGHT}`);

// Maintain 16:9 aspect ratio and center canvas
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

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(window.innerWidth - width) / 2}px`;
    canvas.style.top = `${(window.innerHeight - height) / 2}px`;

    console.log(`Canvas resized to: ${width}x${height} (display size)`);
  } catch (error) {
    console.error('Error resizing canvas:', error);
  }
}

// Set up resize listener
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Add loading indicator
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

// Show initial loading screen
showLoadingIndicator();

// Default keybinds remain the source of truth for initialization
let keybinds = {
  moveLeft: 'a',
  moveRight: 'd',
  jump: 'w',
  dash: ' ',
};

// Load assets and start the game
let engine;
let inputManager;
let menuManager;

loadAssets().then((assets) => {
  console.log('Assets loaded successfully, preparing main menu...');
  
  try {
    const fontRenderer = new FontRenderer(assets.font_spritesheet);
    engine = new Engine(ctx, canvas, assets, keybinds, fontRenderer);

    // Initialize MenuManager to handle all DOM UI
    menuManager = new MenuManager(assets, engine.gameState, keybinds, fontRenderer);
    
    // Link the engine to the menu manager so they can communicate.
    engine.setMenuManager(menuManager);

    // Initialize the InputManager, passing the MenuManager for UI context
    inputManager = new InputManager(
      engine,
      canvas,
      menuManager
    );
    
    // Initialize UI event listeners and set initial states
    menuManager.init();
    
    // Listen for the request to start the game from the main menu
    eventBus.subscribe('requestStartGame', () => {
        engine.start();
    });

    // Listen for the engine actually starting to show the in-game UI
    eventBus.subscribe('gameStarted', () => {
        document.querySelectorAll('.ingame-ui').forEach(el => el.classList.remove('hidden'));
    });
    
    // Expose the unlock function to the window for easy debugging
    window.unlockAllLevels = () => {
        if (engine && engine.gameState) {
            engine.gameState.unlockAllLevels();
            eventBus.publish('gameStateUpdated', engine.gameState);
        }
    };
    console.log('Developer command available: Type `unlockAllLevels()` in the console to unlock all levels.');
    
    // Expose the reset function to the window for easy debugging
    window.resetProgress = () => {
        if (engine && engine.gameState) {
            engine.gameState.resetProgress();
            engine.loadLevel(0, 0);
            console.log("Game reset to Level 1.");
            eventBus.publish('gameStateUpdated', engine.gameState);
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

// Global error handling
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