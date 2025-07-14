import { Engine } from './core/engine.js';
import { loadAssets } from './core/assets.js';

// Get canvas element and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Check if canvas is available
if (!canvas || !ctx) {
  console.error('Canvas not found or context not available');
  document.body.innerHTML = '<h1>Error: Canvas not supported</h1>';
  throw new Error('Canvas not available');
}

// Desired base resolution
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

// Set canvas internal resolution
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
      // Window is wider than 16:9 - constrain by height
      height = window.innerHeight;
      width = height * aspectRatio;
    } else {
      // Window is taller than 16:9 - constrain by width
      width = window.innerWidth;
      height = width / aspectRatio;
    }

    // Apply calculated dimensions
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

// Prevent context menu on right click for better game experience
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Add loading indicator
function showLoadingIndicator() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
  
  // Simple loading bar
  const barWidth = 300;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = canvas.height / 2 + 30;
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(barX, barY, barWidth * 0.1, barHeight); // Will be updated with actual progress
}

// Show initial loading screen
showLoadingIndicator();

// --- Settings and Keybinds Logic ---
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeModalButton = document.getElementById('closeModalButton');
const keybindInputs = document.querySelectorAll('.keybind-item input');

// Default keybinds
let keybinds = {
  moveLeft: 'a',
  moveRight: 'd',
  jump: 'w',
  dash: ' ', // Spacebar
};

let activeKeybindInput = null; // To track which input is currently being rebound

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
    
    // Update sound toggle button
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      soundToggle.textContent = settings.enabled ? 'ON' : 'OFF';
      soundToggle.classList.toggle('sound-enabled', settings.enabled);
      soundToggle.classList.toggle('sound-disabled', !settings.enabled);
    }
    
    // Update volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider && volumeValue) {
      volumeSlider.value = settings.volume;
      volumeValue.textContent = Math.round(settings.volume * 100) + '%';
    }
    
    // Update test sound button state
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
    // When modal opens, update display and pause game
    updateKeybindDisplay();
    updateSoundSettingsDisplay();
    
    if (typeof engine !== 'undefined') {
      engine.pauseForSettings = true; // Add a specific flag
      if (engine.isRunning) {
        engine.pause();
      }
    }
  } else {
    // When modal closes, resume game
    if (typeof engine !== 'undefined') {
      engine.pauseForSettings = false; // Clear the flag
      if (!engine.isRunning) {
        engine.resume();
      }
    }
  }
}

// Sound settings event handlers
function setupSoundSettings() {
  // Sound toggle button
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      if (typeof engine !== 'undefined' && engine.soundManager) {
        const newState = engine.soundManager.toggleSound();
        updateSoundSettingsDisplay();
        console.log(`Sound ${newState ? 'enabled' : 'disabled'}`);
      }
    });
  }
  
  // Volume slider
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
  
  // Test sound button
  const testSoundButton = document.getElementById('testSoundButton');
  if (testSoundButton) {
    testSoundButton.addEventListener('click', () => {
      if (typeof engine !== 'undefined' && engine.soundManager) {
        // Enable audio context if needed
        engine.soundManager.enableAudioContext();
        // Test the jump sound
        engine.soundManager.play('jump', 0.8);
        console.log('Testing sound...');
      }
    });
  }
}

// Event listener for settings button
settingsButton.addEventListener('click', toggleSettingsModal);

// Event listener for close modal button
closeModalButton.addEventListener('click', toggleSettingsModal);

// Event listeners for keybind inputs
keybindInputs.forEach(input => {
  input.addEventListener('click', () => {
    if (activeKeybindInput) {
      // If another input was active, reset its styling
      activeKeybindInput.classList.remove('active-rebind');
    }
    activeKeybindInput = input;
    input.value = 'Press a key...';
    input.classList.add('active-rebind');
  });
});

// Global keydown listener for remapping keybinds
window.addEventListener('keydown', (e) => {
  // Only handle keybind remapping when settings modal is open AND actively remapping
  if (activeKeybindInput && !settingsModal.classList.contains('hidden')) {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from reaching game
    
    const action = activeKeybindInput.dataset.action;
    const newKey = e.key.toLowerCase();

    if (
      newKey &&
      ((newKey.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ||
      ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(newKey))
    ) {
      keybinds[action] = newKey;
      updateKeybindDisplay();
      activeKeybindInput.classList.remove('active-rebind');
      activeKeybindInput = null;

      if (typeof engine !== 'undefined') {
        engine.updateKeybinds(keybinds);
      }
    } else {
      activeKeybindInput.value = keybinds[action] === ' ' ? 'Space' : keybinds[action].toUpperCase();
      activeKeybindInput.classList.remove('active-rebind');
      activeKeybindInput = null;
    }
  }
});

// Function to convert display coordinates to canvas coordinates
function getCanvasCoordinates(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  
  // Get the display size of the canvas
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  
  // Calculate the position relative to the canvas display area
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  
  // Scale from display coordinates to internal canvas coordinates
  const canvasX = (x / displayWidth) * canvas.width;
  const canvasY = (y / displayHeight) * canvas.height;
  
  return { x: canvasX, y: canvasY };
}

// Add click handler for level complete screen
canvas.addEventListener('click', (e) => {
  if (typeof engine !== 'undefined' && engine.gameState.showingLevelComplete) {
    const rect = canvas.getBoundingClientRect();
    
    // Convert to canvas coordinates (matching the display scaling)
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const x = (e.clientX - rect.left) / displayWidth * canvas.width;
    const y = (e.clientY - rect.top) / displayHeight * canvas.height;
    
    // Button dimensions and positions (matching HUD.js exactly)
    const buttonWidth = 32;
    const buttonHeight = 32;
    const panelHeight = 300;
    const panelY = (canvas.height - panelHeight) / 2;
    const buttonY = panelY + 200;

    // Calculate button positions based on available buttons (matching HUD.js)
    const availableButtons = [];
    if (engine.gameState.hasPreviousLevel()) availableButtons.push('previous');
    if (engine.gameState.hasNextLevel()) availableButtons.push('next');
    availableButtons.push('restart');

    const totalButtonWidth = availableButtons.length * buttonWidth + (availableButtons.length - 1) * 10;
    const startX = (canvas.width - totalButtonWidth) / 2;

    let currentX = startX;

    // Check if click is within button area vertically
    if (y >= buttonY && y <= buttonY + buttonHeight) {
      // Check Previous Level button
      if (engine.gameState.hasPreviousLevel()) {
        if (x >= currentX && x <= currentX + buttonWidth) {
          console.log('Previous Level button clicked');
          engine.gameState.handleLevelCompleteAction('previous');
          return;
        }
        currentX += buttonWidth + 10;
      }

      // Check Next Level button
      if (engine.gameState.hasNextLevel()) {
        if (x >= currentX && x <= currentX + buttonWidth) {
          console.log('Next Level button clicked');
          engine.gameState.handleLevelCompleteAction('next');
          return;
        }
        currentX += buttonWidth + 10;
      }
      
      // Check Restart button
      if (x >= currentX && x <= currentX + buttonWidth) {
        console.log('Restart button clicked');
        engine.gameState.handleLevelCompleteAction('restart');
        return;
      }
    }
  }
});

// Add keyboard support for level complete screen
window.addEventListener('keydown', (e) => {
  // Only handle level complete keys when not in settings and level is complete
  if (typeof engine !== 'undefined' && 
      engine.gameState.showingLevelComplete && 
      !activeKeybindInput && 
      settingsModal.classList.contains('hidden')) {
    
    switch(e.key.toLowerCase()) {
      case 'enter':
      case ' ':
        // Space or Enter goes to next level if available, otherwise restart
        if (engine.gameState.hasNextLevel()) {
          console.log('Next Level (keyboard)');
          engine.gameState.handleLevelCompleteAction('next');
        } else {
          console.log('Restart (keyboard)');
          engine.gameState.handleLevelCompleteAction('restart');
        }
        e.preventDefault();
        break;
      case 'r':
        // R always restarts
        console.log('Restart (keyboard)');
        engine.gameState.handleLevelCompleteAction('restart');
        e.preventDefault();
        break;
      case 'n':
        // N goes to next level if available
        if (engine.gameState.hasNextLevel()) {
          console.log('Next Level (keyboard)');
          engine.gameState.handleLevelCompleteAction('next');
        }
        e.preventDefault();
        break;
    }
  }
});

// Function to enable audio context on first user interaction
function enableAudioOnFirstInteraction() {
  let audioEnabled = false;
  
  const enableAudio = (event) => {
    // Skip if audio already enabled or if this is a menu click
    if (audioEnabled) return;
    
    // Check if the click is on a menu button (avoid enabling audio on menu clicks)
    const target = event.target;
    if (target && target.closest('.menu-button, #settingsModal')) {
      return; // Don't enable audio on menu interactions
    }
    
    if (typeof engine !== 'undefined' && engine.soundManager) {
      engine.soundManager.enableAudioContext();
      console.log('Audio context enabled on user interaction');
      audioEnabled = true;
    }
    
    // Remove listeners after first interaction
    if (audioEnabled) {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    }
  };
  
  // Add listeners with lower priority to avoid conflicts
  document.addEventListener('click', enableAudio, false);
  document.addEventListener('keydown', enableAudio, false);
  document.addEventListener('touchstart', enableAudio, false);
}

// Load assets and start the game
let engine; // Declare engine in a scope accessible to modal functions
loadAssets().then((assets) => {
  console.log('Assets loaded successfully, starting game...');
  
  try {
    // Initialize and start the game engine, passing keybinds
    engine = new Engine(ctx, canvas, assets, keybinds);
    engine.start();
    
    // Set up sound settings after engine is initialized
    setupSoundSettings();
    
    // Enable audio context on first user interaction
    enableAudioOnFirstInteraction();
    
    console.log('Game started successfully!');
  } catch (error) {
    console.error('Failed to start game engine:', error);
    
    // Show error message on canvas
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
  
  // Show error message on canvas
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

// Add some basic error handling for the window
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Add some debug info
console.log('Game initialization started');
console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
console.log('Device pixel ratio:', window.devicePixelRatio);
console.log('User agent:', navigator.userAgent);