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

// New Character Selection elements
const characterButton = document.getElementById('characterButton');
const characterModal = document.getElementById('characterModal');
const closeCharacterModalButton = document.getElementById('closeCharacterModalButton');
const characterSelectionContainer = document.getElementById('character-selection-container');


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
    levelSelectionContainer.innerHTML = ''; // Clear previous content

    const gameState = engine.gameState;

    // Iterate over each section object to create separate containers
    gameState.levelSections.forEach((section, sectionIndex) => {
        const sectionContainer = document.createElement('div');
        sectionContainer.classList.add('level-section-menu');

        const sectionTitle = document.createElement('h4');
        // Use the 'name' property from the section object for the title
        sectionTitle.textContent = section.name;
        sectionContainer.appendChild(sectionTitle);

        const levelGrid = document.createElement('div');
        levelGrid.classList.add('level-grid');

        // Iterate over levels within the current section's 'levels' array
        section.levels.forEach((level, levelIndex) => {
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
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>`;
            }
            levelGrid.appendChild(button);
        });

        sectionContainer.appendChild(levelGrid);
        levelSelectionContainer.appendChild(sectionContainer);
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

// Function to populate the character selection menu
function populateCharacterMenu() {
    if (!engine) return;
    characterSelectionContainer.innerHTML = ''; // Clear previous content

    const availableCharacters = Object.keys(engine.assets.characters);
    const gameState = engine.gameState;

    availableCharacters.forEach(charId => {
        const card = document.createElement('div');
        card.className = 'character-card';

        const isUnlocked = gameState.isCharacterUnlocked(charId);
        const isSelected = gameState.selectedCharacter === charId;
        
        if (!isUnlocked) card.classList.add('locked');
        if (isSelected) card.classList.add('selected');

        const idleSprite = engine.assets.characters[charId]?.playerIdle;
        const charNameFormatted = charId.replace(/([A-Z])/g, ' $1').trim();

        const unlockText = isUnlocked ? 'Available' : 'Complete more levels to unlock';
        let buttonContent = isSelected ? 'Selected' : 'Select';
        if (!isUnlocked) {
            buttonContent = `<svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg> Locked`;
        }

        card.innerHTML = `
            <img src="${idleSprite?.src || ''}" class="char-img">
            <div class="char-name">${charNameFormatted}</div>
            <div class="char-unlock">${unlockText}</div>
            <button class="action-button select-button">${buttonContent}</button>
        `;

        const selectButton = card.querySelector('.select-button');
        if (!isUnlocked) {
            selectButton.disabled = true;
        } else {
            selectButton.addEventListener('click', () => {
                if (isSelected) return;
                gameState.setSelectedCharacter(charId);
                engine.updatePlayerCharacter();
                populateCharacterMenu(); // Redraw menu to update styles
            });
        }

        characterSelectionContainer.appendChild(card);
    });
}

// Function to toggle the character selection modal
function toggleCharacterModal() {
    characterModal.classList.toggle('hidden');

    if (!characterModal.classList.contains('hidden')) {
        populateCharacterMenu();
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

// Event listeners for the new character modal
characterButton.addEventListener('click', toggleCharacterModal);
closeCharacterModalButton.addEventListener('click', toggleCharacterModal);


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