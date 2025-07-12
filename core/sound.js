// Sound Manager for game audio

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.7;
    this.loadSettings();
  }

  // Load sound settings from localStorage
  loadSettings() {
    try {
      const settings = localStorage.getItem('game_sound_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled !== undefined ? parsed.enabled : true;
        this.volume = parsed.volume !== undefined ? parsed.volume : 0.7;
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
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  // Load sound files from assets
  loadSounds(assets) {
    console.log('Loading sounds...');
    
    // Create Audio objects for each sound
    const soundKeys = ['jump', 'collect', 'level_complete'];
    
    soundKeys.forEach(key => {
      if (assets[key]) {
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.volume = this.volume;
          
          // Handle different asset formats - assets are image objects, but for sounds we need the src
          if (typeof assets[key] === 'string') {
            audio.src = assets[key];
          } else if (assets[key].src) {
            audio.src = assets[key].src;
          } else {
            // For our asset loading system, we need to create a new Audio with the path
            audio.src = this.getSoundPath(key);
          }
          
          this.sounds[key] = audio;
          console.log(`Loaded sound: ${key}`);
        } catch (error) {
          console.warn(`Failed to load sound ${key}:`, error);
        }
      } else {
        console.warn(`Sound asset ${key} not found`);
      }
    });
  }

  // Helper to get sound file paths
  getSoundPath(key) {
    const soundPaths = {
      jump: 'assets/Sounds/Player Jump.wav',
      collect: 'assets/Sounds/Fruit Collect.mp3',
      level_complete: 'assets/Sounds/Level Complete.mp3'
    };
    return soundPaths[key] || '';
  }

  // Play a sound effect
  play(soundKey, volume = 1.0) {
    if (!this.enabled || !this.sounds[soundKey]) {
      return;
    }

    try {
      const sound = this.sounds[soundKey];
      
      // Clone the audio for overlapping sounds
      const audioClone = sound.cloneNode();
      audioClone.volume = Math.min(this.volume * volume, 1.0);
      
      // Play the sound
      const playPromise = audioClone.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented, this is normal on first load
          if (error.name !== 'NotAllowedError') {
            console.warn(`Failed to play sound ${soundKey}:`, error);
          }
        });
      }
    } catch (error) {
      console.warn(`Error playing sound ${soundKey}:`, error);
    }
  }

  // Stop a sound
  stop(soundKey) {
    if (this.sounds[soundKey]) {
      try {
        this.sounds[soundKey].pause();
        this.sounds[soundKey].currentTime = 0;
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
      volume: this.volume
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
}