// PIXI MIGRATION: Imports from PixiJS and initializes a Pixi App instead of a 2D context.
import * as PIXI from 'pixi.js';
import { Engine } from './core/engine.js';
import { loadAssets } from './core/assets.js';
import { InputManager } from './core/input.js';
import { MenuManager } from './ui/menu-manager.js';
import { eventBus } from './core/event-bus.js';

// Get canvas element
const canvas = document.getElementById('gameCanvas');

// PIXI MIGRATION: Define base resolution for Pixi
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

console.log(`Target resolution: ${BASE_WIDTH}x${BASE_HEIGHT}`);

// PIXI MIGRATION: Create a PixiJS Application
const app = new PIXI.Application();

async function initGame() {
    await app.init({
        canvas: canvas,
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });
    console.log(`PixiJS App initialized on canvas.`);

    resizeCanvas(); // Initial resize
    window.addEventListener('resize', resizeCanvas);

    // PIXI MIGRATION: Use Pixi objects for the loading indicator
    const loadingContainer = new PIXI.Container();
    app.stage.addChild(loadingContainer);

    const bg = new PIXI.Graphics()
        .rect(0, 0, BASE_WIDTH, BASE_HEIGHT)
        .fill('#222');
    loadingContainer.addChild(bg);
    
    const loadingText = new PIXI.Text({
        text: 'Loading Assets...',
        style: { fill: 'white', fontSize: 24, fontFamily: 'sans-serif' }
    });
    loadingText.anchor.set(0.5);
    loadingText.position.set(BASE_WIDTH / 2, BASE_HEIGHT / 2);
    loadingContainer.addChild(loadingText);

    // Default keybinds
    let keybinds = {
      moveLeft: 'a',
      moveRight: 'd',
      jump: 'w',
      dash: ' ',
    };

    // Load assets and start the game
    try {
        const assets = await loadAssets();
        console.log('Assets loaded, starting game...');
        
        loadingContainer.destroy(); // Remove loading screen

        const engine = new Engine(app, assets, keybinds);
        const menuManager = new MenuManager(assets, engine.gameState, keybinds);
        const inputManager = new InputManager(engine, app.canvas, menuManager);
        
        menuManager.init();
        engine.start();
        
        eventBus.publish('gameResumed');

        // Developer Commands
        window.unlockAllLevels = () => {
            engine.gameState.unlockAllLevels();
            eventBus.publish('gameStateUpdated', engine.gameState);
        };
        window.resetProgress = () => {
            engine.gameState.resetProgress();
            engine.loadLevel(0, 0);
            eventBus.publish('gameStateUpdated', engine.gameState);
        };

        console.log('Game started successfully!');

    } catch (error) {
        console.error("Failed to load assets or start game:", error);
        loadingText.text = 'Error: Failed to load. Check console.';
        loadingText.style.fill = 'red';
    }
}

// PIXI MIGRATION: This function now resizes the canvas element's style for responsive scaling.
// Pixi's renderer will automatically handle the internal scaling.
function resizeCanvas() {
    const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
    const windowRatio = window.innerWidth / window.innerHeight;
    let width, height;

    if (windowRatio > aspectRatio) {
        height = window.innerHeight;
        width = height * aspectRatio;
    } else {
        width = window.innerWidth;
        height = width / aspectRatio;
    }

    app.canvas.style.width = `${width}px`;
    app.canvas.style.height = `${height}px`;
    app.canvas.style.position = 'absolute';
    app.canvas.style.left = `${(window.innerWidth - width) / 2}px`;
    app.canvas.style.top = `${(window.innerHeight - height) / 2}px`;
}

initGame();