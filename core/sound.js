// Enhanced Sound Manager with fixes and improvements
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.8;
    this.audioContext = null;
    this.audioEnabled = false;
    
    // In-memory settings storage (localStorage not supported in artifacts)
    this.settings = {
      enabled: true,
      volume: 0.8
    };
    
    console.log('SoundManager initialized with volume:', this.volume);
  }

  // Use in-memory storage instead of localStorage
  loadSettings() {
    // Settings are now stored in memory only
    this.enabled = this.settings.enabled;
    this.volume = this.settings.volume;
    console.log('Sound settings loaded from memory:', { enabled: this.enabled, volume: this.volume });
  }

  // Save to memory instead of localStorage
  saveSettings() {
    this.settings.enabled = this.enabled;
    this.settings.volume = this.volume;
    console.log('Sound settings saved to memory:', this.settings);
  }

  // Simplified sound loading using existing assets directly
  loadSounds(assets) {
    console.log('Loading sounds...');
    console.log('Available assets:', Object.keys(assets));
    
    const soundKeys = ['jump', 'collect', 'level_complete'];
    
    soundKeys.forEach(key => {
      if (assets[key]) {
        try {
          // Use the assets directly instead of creating new Audio objects
          const sound = assets[key];
          
          // Set initial volume
          sound.volume = this.volume;
          
          // Add error handling for the existing audio element
          sound.addEventListener('error', (error) => {
            console.error(`Sound ${key} error:`, error);
          });
          
          // Store reference to the asset
          this.sounds[key] = sound;
          console.log(`Registered sound: ${key} (duration: ${sound.duration})`);
        } catch (error) {
          console.warn(`Failed to register sound ${key}:`, error);
        }
      } else {
        console.warn(`Sound asset ${key} not found in assets`);
      }
    });
    
    console.log('Sounds registered:', Object.keys(this.sounds));
  }

  // Simplified and more reliable play method
  play(soundKey, volumeMultiplier = 1.0) {
    if (!this.enabled) {
      console.log(`Sound disabled, not playing: ${soundKey}`);
      return;
    }

    if (!this.sounds[soundKey]) {
      console.warn(`Sound not found: ${soundKey}`);
      return;
    }

    try {
      const sound = this.sounds[soundKey];
      
      // Clone the audio for overlapping sounds
      const audioClone = sound.cloneNode();
      audioClone.volume = Math.min(this.volume * volumeMultiplier, 1.0);
      
      // Reset and play
      audioClone.currentTime = 0;
      
      const playPromise = audioClone.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`✓ Successfully played sound: ${soundKey}`);
        }).catch(error => {
          console.error(`✗ Failed to play sound ${soundKey}:`, error);
          
          // Fallback to original audio element
          try {
            sound.currentTime = 0;
            sound.volume = Math.min(this.volume * volumeMultiplier, 1.0);
            sound.play();
          } catch (fallbackError) {
            console.error(`Fallback play failed for ${soundKey}:`, fallbackError);
          }
        });
      }
    } catch (error) {
      console.error(`Exception playing sound ${soundKey}:`, error);
    }
  }

  // Better test method with multiple fallbacks
  testSound(soundKey) {
    console.log(`\n=== TESTING SOUND: ${soundKey} ===`);
    
    if (!this.sounds[soundKey]) {
      console.log(`Sound ${soundKey} not found`);
      return;
    }
    
    const sound = this.sounds[soundKey];
    console.log(`Sound properties:`, {
      readyState: sound.readyState,
      duration: sound.duration,
      volume: sound.volume,
      paused: sound.paused,
      src: sound.src?.substring(0, 50) + '...'
    });
    
    // Test 1: Normal play method
    console.log('Test 1: Using play() method...');
    this.play(soundKey, 1.0);
    
    // Test 2: Direct audio play
    setTimeout(() => {
      console.log('Test 2: Direct audio element play...');
      try {
        const testAudio = sound.cloneNode();
        testAudio.volume = 0.8;
        testAudio.currentTime = 0;
        testAudio.play().then(() => {
          console.log('✓ Direct play successful');
        }).catch(error => {
          console.log('✗ Direct play failed:', error);
        });
      } catch (error) {
        console.log('✗ Direct play exception:', error);
      }
    }, 500);
  }

  // Streamlined audio context initialization
  enableAudioContext() {
    console.log('Enabling audio context...');
    
    try {
      // Try to create and resume audio context
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
        }
      }
      
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('Audio context resumed');
          this.audioEnabled = true;
        });
      } else {
        this.audioEnabled = true;
      }
      
      // Simple audio unlock - play all sounds at zero volume
      this.unlockAudio();
      
    } catch (error) {
      console.warn('Audio context setup error:', error);
    }
  }

  // Simple audio unlock method
  unlockAudio() {
    console.log('Unlocking audio...');
    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        try {
          const originalVolume = sound.volume;
          sound.volume = 0;
          sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
            sound.volume = originalVolume;
          }).catch(() => {
            // Ignore unlock errors
          });
        } catch (error) {
          // Ignore unlock errors
        }
      }
    });
  }

  // Better stop method
  stop(soundKey) {
    if (this.sounds[soundKey]) {
      try {
        const sound = this.sounds[soundKey];
        sound.pause();
        sound.currentTime = 0;
        console.log(`Stopped sound: ${soundKey}`);
      } catch (error) {
        console.warn(`Error stopping sound ${soundKey}:`, error);
      }
    }
  }

  // Stop all sounds
  stopAll() {
    Object.keys(this.sounds).forEach(key => {
      this.stop(key);
    });
  }

  // Better volume control with immediate effect
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`Master volume set to: ${this.volume}`);
    
    // Update all loaded sounds immediately
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = this.volume;
      }
    });
    
    this.saveSettings();
  }

  // Toggle sound on/off
  toggleSound() {
    this.enabled = !this.enabled;
    this.saveSettings();
    
    if (!this.enabled) {
      this.stopAll();
    }
    
    console.log(`Sound ${this.enabled ? 'enabled' : 'disabled'}`);
    return this.enabled;
  }

  // Enable/disable sound
  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();
    
    if (!this.enabled) {
      this.stopAll();
    }
  }

  // Get current settings
  getSettings() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      audioEnabled: this.audioEnabled
    };
  }

  // Force play method for testing (bypasses enabled check)
  forcePlay(soundKey, volumeMultiplier = 1.0) {
    if (!this.sounds[soundKey]) {
      console.warn(`Sound not found for force play: ${soundKey}`);
      return;
    }

    try {
      const sound = this.sounds[soundKey];
      sound.volume = Math.min(this.volume * volumeMultiplier, 1.0);
      sound.currentTime = 0;
      
      const playPromise = sound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`✓ Force played sound: ${soundKey}`);
        }).catch(error => {
          console.error(`✗ Force play failed for ${soundKey}:`, error);
        });
      }
    } catch (error) {
      console.error(`Exception in force play ${soundKey}:`, error);
    }
  }

  // Check if sound is ready
  isSoundReady(soundKey) {
    const sound = this.sounds[soundKey];
    return sound && sound.readyState >= 2; // HAVE_CURRENT_DATA
  }

  // Get comprehensive debug info
  getDebugInfo() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      audioEnabled: this.audioEnabled,
      audioContext: this.audioContext?.state,
      soundCount: Object.keys(this.sounds).length,
      sounds: Object.keys(this.sounds).map(key => ({
        key,
        ready: this.isSoundReady(key),
        duration: this.sounds[key]?.duration,
        volume: this.sounds[key]?.volume,
        readyState: this.sounds[key]?.readyState
      }))
    };
  }

  // Quick sound test method
  quickTest() {
    console.log('=== QUICK SOUND TEST ===');
    const testOrder = ['jump', 'collect', 'level_complete'];
    
    testOrder.forEach((soundKey, index) => {
      setTimeout(() => {
        console.log(`Testing ${soundKey}...`);
        this.forcePlay(soundKey, 0.5);
      }, index * 1000);
    });
  }
}