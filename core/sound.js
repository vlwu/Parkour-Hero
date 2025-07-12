// Enhanced Sound Manager with better debugging and fixes
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.8; // Increased default volume
    this.audioContext = null;
    this.audioEnabled = false;
    this.loadSettings();
    console.log('SoundManager initialized with volume:', this.volume);
  }

  // Load sound settings from localStorage
  loadSettings() {
    try {
      const settings = localStorage.getItem('game_sound_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled !== undefined ? parsed.enabled : true;
        this.volume = parsed.volume !== undefined ? parsed.volume : 0.8;
        console.log('Sound settings loaded:', { enabled: this.enabled, volume: this.volume });
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  // Save sound settings to localStorage
  saveSettings() {
    try {
      const settings = {
        enabled: this.enabled,
        volume: this.volume
      };
      localStorage.setItem('game_sound_settings', JSON.stringify(settings));
      console.log('Sound settings saved:', settings);
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  // Load sound files from assets with better error handling
  loadSounds(assets) {
    console.log('Loading sounds...');
    console.log('Available assets:', Object.keys(assets));
    
    const soundKeys = ['jump', 'collect', 'level_complete'];
    
    soundKeys.forEach(key => {
      if (assets[key]) {
        try {
          const originalAudio = assets[key];
          
          // Create a new Audio object to avoid conflicts
          const sound = new Audio();
          sound.src = originalAudio.src;
          sound.volume = this.volume;
          sound.preload = 'auto';
          
          // Add event listeners for debugging
          sound.addEventListener('loadeddata', () => {
            console.log(`Sound ${key} loaded successfully`);
          });
          
          sound.addEventListener('error', (error) => {
            console.error(`Sound ${key} loading error:`, error);
          });
          
          this.sounds[key] = sound;
          console.log(`Registered sound: ${key}`);
        } catch (error) {
          console.warn(`Failed to load sound ${key}:`, error);
        }
      } else {
        console.warn(`Sound asset ${key} not found in assets`);
      }
    });
    
    console.log('Sounds loaded:', Object.keys(this.sounds));
  }

  // Enhanced play method with better debugging
  play(soundKey, volumeMultiplier = 1.0) {
    console.log(`Attempting to play sound: ${soundKey}`);
    console.log(`Sound enabled: ${this.enabled}`);
    console.log(`Volume: ${this.volume * volumeMultiplier}`);
    
    if (!this.enabled) {
      console.log(`Sound disabled, not playing: ${soundKey}`);
      return;
    }

    if (!this.sounds[soundKey]) {
      console.warn(`Sound not found: ${soundKey}`);
      console.log('Available sounds:', Object.keys(this.sounds));
      return;
    }

    try {
      const sound = this.sounds[soundKey];
      console.log(`Sound object exists: ${!!sound}`);
      console.log(`Sound ready state: ${sound.readyState}`);
      console.log(`Sound duration: ${sound.duration}`);
      console.log(`Sound paused: ${sound.paused}`);
      
      // Reset the sound to the beginning
      sound.currentTime = 0;
      sound.volume = Math.min(this.volume * volumeMultiplier, 1.0);
      
      console.log(`Setting volume to: ${sound.volume}`);
      
      // Play the sound
      const playPromise = sound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`✓ Successfully played sound: ${soundKey}`);
        }).catch(error => {
          console.error(`✗ Failed to play sound ${soundKey}:`, error);
          
          // Try to provide more specific error info
          if (error.name === 'NotAllowedError') {
            console.log('Auto-play was prevented - user interaction required');
          } else if (error.name === 'NotSupportedError') {
            console.log('Audio format not supported');
          } else if (error.name === 'AbortError') {
            console.log('Audio playback aborted');
          }
        });
      }
    } catch (error) {
      console.error(`Exception playing sound ${soundKey}:`, error);
    }
  }

  // Test a sound with comprehensive debugging
  testSound(soundKey) {
    console.log(`\n=== TESTING SOUND: ${soundKey} ===`);
    console.log(`Sound enabled: ${this.enabled}`);
    console.log(`Master volume: ${this.volume}`);
    console.log(`Sound exists: ${!!this.sounds[soundKey]}`);
    
    if (this.sounds[soundKey]) {
      const sound = this.sounds[soundKey];
      console.log(`Sound properties:`, {
        readyState: sound.readyState,
        duration: sound.duration,
        volume: sound.volume,
        paused: sound.paused,
        ended: sound.ended,
        currentTime: sound.currentTime,
        src: sound.src
      });
      
      // Test different volumes
      console.log('Testing with maximum volume...');
      this.play(soundKey, 1.0);
      
      // Also try playing the raw audio element
      setTimeout(() => {
        console.log('Testing raw audio playback...');
        try {
          sound.volume = 1.0;
          sound.currentTime = 0;
          sound.play().then(() => {
            console.log('Raw audio played successfully');
          }).catch(error => {
            console.log('Raw audio failed:', error);
          });
        } catch (error) {
          console.log('Raw audio exception:', error);
        }
      }, 1000);
    }
  }

  // Enable audio context (call this on first user interaction)
  enableAudioContext() {
    console.log('Enabling audio context...');
    
    // Try to create audio context
    try {
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
          console.log('Audio context created:', this.audioContext.state);
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
    } catch (error) {
      console.warn('Audio context error:', error);
    }
    
    // Try to play a silent sound to unlock audio
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        const originalVolume = sound.volume;
        sound.volume = 0;
        sound.play().then(() => {
          sound.pause();
          sound.currentTime = 0;
          sound.volume = originalVolume;
          console.log('Audio unlocked for sound');
        }).catch(() => {
          // Ignore errors
        });
      }
    });
  }

  // Stop a sound
  stop(soundKey) {
    if (this.sounds[soundKey]) {
      try {
        this.sounds[soundKey].pause();
        this.sounds[soundKey].currentTime = 0;
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

  // Set master volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`Master volume set to: ${this.volume}`);
    
    // Update all loaded sounds
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

  // Preload sounds for better performance
  preloadSounds() {
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        try {
          sound.load();
        } catch (error) {
          // Ignore preload errors
        }
      }
    });
  }

  // Add method to check if sound is ready
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
        volume: this.sounds[key]?.volume
      }))
    };
  }
}