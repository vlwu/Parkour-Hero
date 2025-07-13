// core/input-manager.js
export class InputManager {
  constructor(initialKeybinds) {
    this.keys = {};
    this.keybinds = initialKeybinds;
    this.audioUnlocked = false;
    
    // Jump tracking for audio
    this.wasJumpPressed = false;
    this.lastJumpTime = 0;
    this.jumpCooldown = 150; // ms
    
    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.key.toLowerCase()] = true;
      
      if (!this.audioUnlocked) {
        this.unlockAudio();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('click', (e) => {
      if (!this.audioUnlocked) {
        this.unlockAudio();
      }
    });

    window.addEventListener('touchstart', (e) => {
      if (!this.audioUnlocked) {
        this.unlockAudio();
      }
    });
  }

  unlockAudio() {
    this.audioUnlocked = true;
    // Emit event that audio context can be enabled
    this.onAudioUnlock?.();
  }

  updateKeybinds(newKeybinds) {
    this.keybinds = { ...newKeybinds };
  }

  getInputActions() {
    return {
      moveLeft: this.keys[this.keybinds.moveLeft] || false,
      moveRight: this.keys[this.keybinds.moveRight] || false,
      jump: this.keys[this.keybinds.jump] || false,
      dash: this.keys[this.keybinds.dash] || false,
    };
  }

  // Simplified jump detection for audio
  detectJumpSound(inputActions) {
    const now = Date.now();
    const jumpPressed = inputActions.jump;
    
    // Check if jump was just pressed (transition from false to true)
    const jumpJustPressed = jumpPressed && !this.wasJumpPressed;
    
    // Update state for next frame
    this.wasJumpPressed = jumpPressed;
    
    // If jump was just pressed and enough time has passed since last jump sound
    if (jumpJustPressed && (now - this.lastJumpTime) > this.jumpCooldown) {
      this.lastJumpTime = now;
      return true;
    }
    
    return false;
  }

  // Check if a specific key is pressed
  isKeyPressed(key) {
    return this.keys[key] || false;
  }

  // Get current keybinds
  getKeybinds() {
    return { ...this.keybinds };
  }

  // Set callback for audio unlock
  setAudioUnlockCallback(callback) {
    this.onAudioUnlock = callback;
  }

  // Check if audio is unlocked
  isAudioUnlocked() {
    return this.audioUnlocked;
  }
}