// main.js

import { Engine } from './core/engine.js';
import { loadAssets } from './core/assets.js';
import { InputManager } from './core/input.js';

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

const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeModalButton = document.getElementById('closeModalButton');
const keybindInputs = document.querySelectorAll('.keybind-item input');
const pauseButton = document.getElementById('pauseButton');

// New Main Menu elements
const mainMenuButton = document.getElementById('mainMenuButton');
const mainMenuModal = document.getElementById('mainMenuModal');
const closeMainMenuButton = document.getElementById('closeMainMenuButton');
const levelSelectionContainer = document.getElementById('level-selection-container');


// Default keybinds remain the source of truth here
let keybinds = {
  moveLeft: 'a',
  moveRight: 'd',
  jump: 'w',
  dash: ' ',
};

// Function to update the pause button icon based on the engine's state
function updatePauseButtonIcon() {
  if (typeof engine === 'undefined') return;

  if (engine.isRunning) {
    pauseButton.classList.remove('is-paused');
    pauseButton.setAttribute('aria-label', 'Pause');
  } else {
    pauseButton.classList.add('is-paused');
    pauseButton.setAttribute('aria-label', 'Resume');
  }
}

// Function to update the displayed keybinds in the modal
function updateKeybindDisplay() {
  keybindInputs.forEach(input => {
    const action = input.dataset.action;
    input.value = keybinds[action] === ' ' ? 'Space' : keybinds[action].toUpperCase();
  });
}

// Function to update sound settings display
function updateSoundSettingsDisplay() {
  if (typeof engine !== 'undefined' && engine.soundManager) {
    const settings = engine.soundManager.getSettings();
    
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      soundToggle.textContent = settings.enabled ? 'ON' : 'OFF';
      soundToggle.classList.toggle('sound-enabled', settings.enabled);
      soundToggle.classList.toggle('sound-disabled', !settings.enabled);
    }
    
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider && volumeValue) {
      volumeSlider.value = settings.volume;
      volumeValue.textContent = Math.round(settings.volume * 100) + '%';
    }
    
    const testSoundButton = document.getElementById('testSoundButton');
    if (testSoundButton) {
      testSoundButton.disabled = !settings.enabled;
    }
  }
}

// Function to toggle the settings modal visibility
function toggleSettingsModal() {
  settingsModal.classList.toggle('hidden');
  
  if (!settingsModal.classList.contains('hidden')) {
    updateKeybindDisplay();
    updateSoundSettingsDisplay();
    
    if (typeof engine !== 'undefined') {
      engine.pauseForMenu = true; 
      if (engine.isRunning) {
        engine.pause();
      }
      updatePauseButtonIcon();
    }
  } else {
    if (typeof engine !== 'undefined') {
      engine.pauseForMenu = false; 
      if (!engine.isRunning) {
        engine.resume();
      }
      updatePauseButtonIcon();
    }
  }
}

// Function to populate the level selection grid
function populateLevelMenu() {
    if (!engine) return;
    levelSelectionContainer.innerHTML = ''; // Clear previous buttons

    const gameState = engine.gameState;
    gameState.levelSections.forEach((section, sectionIndex) => {
        section.forEach((level, levelIndex) => {
            const button = document.createElement('button');
            button.textContent = `${levelIndex + 1}`;
            button.classList.add('level-button');

            const isUnlocked = gameState.isLevelUnlocked(sectionIndex, levelIndex);
            
            if (isUnlocked) {
                if (gameState.isLevelCompleted(sectionIndex, levelIndex)) {
                    button.classList.add('completed');
                }
                if (gameState.currentSection === sectionIndex && gameState.currentLevelIndex === levelIndex) {
                    button.classList.add('current');
                }

                button.addEventListener('click', () => {
                    engine.loadLevel(sectionIndex, levelIndex);
                    toggleMainMenuModal(); // Close menu after selection
                });
            } else {
                button.classList.add('locked');
                button.disabled = true;
                button.innerHTML = '<img src="assets/Menu/Levels/Locked.png" alt="Locked">';
            }
            levelSelectionContainer.appendChild(button);
        });
    });
}


// Function to toggle the main menu modal visibility
function toggleMainMenuModal() {
    mainMenuModal.classList.toggle('hidden');

    if (!mainMenuModal.classList.contains('hidden')) {
        populateLevelMenu(); // Refresh level buttons every time menu is opened
        if (typeof engine !== 'undefined') {
            engine.pauseForMenu = true;
            if (engine.isRunning) {
                engine.pause();
            }
            updatePauseButtonIcon();
        }
    } else {
        if (typeof engine !== 'undefined') {
            engine.pauseForMenu = false;
            if (!engine.isRunning && !engine.gameState.showingLevelComplete) {
                engine.resume();
            }
            updatePauseButtonIcon();
        }
    }
}

// Sound settings event handlers
function setupSoundSettings() {
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      if (typeof engine !== 'undefined' && engine.soundManager) {
        engine.soundManager.toggleSound();
        updateSoundSettingsDisplay();
      }
    });
  }
  
  const volumeSlider = document.getElementById('volumeSlider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const volume = parseFloat(e.target.value);
      if (typeof engine !== 'undefined' && engine.soundManager) {
        engine.soundManager.setVolume(volume);
        updateSoundSettingsDisplay();
      }
    });
  }
  
  const testSoundButton = document.getElementById('testSoundButton');
  if (testSoundButton) {
    testSoundButton.addEventListener('click', () => {
      if (typeof engine !== 'undefined' && engine.soundManager) {
        engine.soundManager.enableAudioContext();
        engine.soundManager.play('jump', 0.8);
      }
    });
  }
}

// Event listeners for UI buttons are still managed here
settingsButton.addEventListener('click', toggleSettingsModal);
closeModalButton.addEventListener('click', toggleSettingsModal);

// mainMenuButton now opens the main menu modal
mainMenuButton.addEventListener('click', toggleMainMenuModal);
closeMainMenuButton.addEventListener('click', toggleMainMenuModal);


pauseButton.addEventListener('click', () => {
  if (typeof engine !== 'undefined') {
    if (engine.isRunning) {
      engine.pause();
    } else {
      engine.resume();
    }
    updatePauseButtonIcon();
  }
});


// Load assets and start the game
let engine;
let inputManager;

loadAssets().then((assets) => {
  console.log('Assets loaded successfully, starting game...');
  
  try {
    engine = new Engine(ctx, canvas, assets, keybinds, {
      onMainMenu: toggleMainMenuModal,
    });

    // Initialize the InputManager, passing all necessary dependencies
    inputManager = new InputManager(
      engine,
      canvas,
      keybinds,
      { settingsModal, keybindInputs, mainMenuModal },
      { updateKeybindDisplay, updatePauseButtonIcon }
    );
    
    engine.start();
    
    setupSoundSettings();
    updatePauseButtonIcon();
    
    // Expose the unlock function to the window for easy debugging
    window.unlockAllLevels = () => {
        if (engine && engine.gameState) {
            engine.gameState.unlockAllLevels();
            // If the main menu is open, refresh it to show the unlocked levels
            if (!mainMenuModal.classList.contains('hidden')) {
                populateLevelMenu();
            }
        }
    };
    console.log('Developer command available: Type `unlockAllLevels()` in the console to unlock all levels.');
    
    console.log('Game started successfully!');
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