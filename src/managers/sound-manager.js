import { eventBus } from '../utils/event-bus.js';

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.soundPool = {}; // Stores arrays of pooled audio objects for reuse.
    this.poolSize = 5; // Number of audio objects per sound effect.
    
    this.channels = {
      SFX: new Set(),
      UI: new Set(),
      Music: new Set(),
    };

    this.audioContext = null;
    this.audioUnlocked = false;
    this.settings = {
      enabled: true,
      volume: 0.5,
    };
    this.subscriptions = [];
    this._unlockHandler = null;
    
    this.loadSettings();
    this._setupEventSubscriptions();
    this._addInteractionListenerForAudioUnlock();
  }

  _addInteractionListenerForAudioUnlock() {
    this._unlockHandler = async () => {
        await this.unlockAudio();
        if (this.audioUnlocked) {
            this.destroyInteractionListeners();
        }
    };

    window.addEventListener('click', this._unlockHandler);
    window.addEventListener('keydown', this._unlockHandler);
    window.addEventListener('touchstart', this._unlockHandler);
  }
  
  destroyInteractionListeners() {
      if (this._unlockHandler) {
          window.removeEventListener('click', this._unlockHandler);
          window.removeEventListener('keydown', this._unlockHandler);
          window.removeEventListener('touchstart', this._unlockHandler);
          this._unlockHandler = null;
      }
  }

  _setupEventSubscriptions() {
    const subscribeAndTrack = (eventName, callback) => {
        const boundCallback = callback.bind(this);
        this.subscriptions.push({ eventName, callback: boundCallback });
        eventBus.subscribe(eventName, boundCallback);
    };
    subscribeAndTrack('playSound', this.play);
    subscribeAndTrack('startSoundLoop', this.playLoop);
    subscribeAndTrack('stopSoundLoop', ({key}) => this.stopLoop(key));
    subscribeAndTrack('toggleSound', this.toggleSound);
    subscribeAndTrack('setSoundVolume', ({volume}) => this.setVolume(volume));
  }

  destroy() {
      this.subscriptions.forEach(({ eventName, callback }) => {
          eventBus.unsubscribe(eventName, callback);
      });
      this.subscriptions = [];
      this.destroyInteractionListeners();
      this.stopAll();
  }

  loadSettings() {
    this.settings.enabled = true;
    this.settings.volume = 0.5;
  }

  saveSettings() {}

  loadSounds(assets) {
    const soundKeys = ['button_click', 'jump', 'double_jump', 'collect', 'level_complete', 'trophy_activated', 'death_sound', 'dash', 'checkpoint_activated', 
      'hit', 'enemy_stomp', 'sand_walk', 'mud_run', 'ice_run', 'trampoline_bounce', 'fire_activated', 'arrow_pop', 'fan_blowing', 'rh_slam', 'sh_slam',
      'snail_wall_hit'];
    soundKeys.forEach(key => {
      if (assets[key]) {
        this.sounds[key] = assets[key];
        this.soundPool[key] = [];
        for (let i = 0; i < this.poolSize; i++) {
            this.soundPool[key].push(this.sounds[key].cloneNode(true));
        }
      } else {
        console.warn(`Sound asset ${key} not found in assets`);
      }
    });
  }

  async play({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.channels[channel]) {
      return;
    }

    if (!this.audioUnlocked) {
      await this.unlockAudio();
    }

    const pool = this.soundPool[key];
    if (!pool) {
      console.warn(`Sound pool for ${key} not found.`);
      return;
    }
    
    const audio = pool.find(a => a.paused || a.ended);
    
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      audio.currentTime = 0;
      
      this.channels[channel].add(audio);
      
      audio.onended = () => {
        this.channels[channel].delete(audio);
        audio.onended = null;
      };

      try {
        await audio.play();
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error(`Audio pool play failed for ${key}:`, e);
        }
        this.channels[channel].delete(audio);
      }
    } else {
      console.warn(`Sound pool for ${key} was depleted. No sound played.`);
    }
  }

  async playLoop({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.channels[channel]) {
      return;
    }
    if (Array.from(this.channels[channel]).some(audio => audio.src === this.sounds[key].src)) {
        return;
    }

    if (!this.audioUnlocked) await this.unlockAudio();

    try {
      const audio = this.sounds[key].cloneNode(true);
      audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      audio.loop = true;
      await audio.play();
      this.channels[channel].add(audio);
    } catch (error) {
      console.error(`Failed to play looping sound ${key}:`, error);
    }
  }

  stopLoop(soundKey) {
    const soundSrc = this.sounds[soundKey]?.src;
    if (!soundSrc) return;
    
    for (const channelName in this.channels) {
        this.channels[channelName].forEach(audio => {
            if (audio.src === soundSrc && audio.loop) {
                audio.pause();
                audio.currentTime = 0;
                this.channels[channelName].delete(audio);
            }
        });
    }
  }

  stopAll({ except = [] } = {}) {
    for (const channelName in this.channels) {
      if (except.includes(channelName)) {
        continue;
      }
      this.channels[channelName].forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.channels[channelName].clear();
    }
  }

  async unlockAudio() {
    if (this.audioUnlocked) return;

    if (!this.audioContext) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
        }
      } catch (e) {
        console.error("Failed to create AudioContext", e);
        return;
      }
    }
    
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(e => console.error("Failed to resume AudioContext", e));
    }

    if (this.audioContext.state === 'running') {
        this.audioUnlocked = true;
    }
  }
  
  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    
    for (const channelName in this.channels) {
        this.channels[channelName].forEach(audio => {
            audio.volume = this.settings.volume;
        });
    }
    this.saveSettings();
    eventBus.publish('soundSettingsChanged', { soundEnabled: this.settings.enabled, soundVolume: this.settings.volume });
  }
  
  setEnabled(enabled) {
    this.settings.enabled = enabled;
    if (!this.settings.enabled) {
      this.stopAll();
    }
    this.saveSettings();
    eventBus.publish('soundSettingsChanged', { soundEnabled: this.settings.enabled, soundVolume: this.settings.volume });
  }
  
  toggleSound() {
    this.setEnabled(!this.settings.enabled);
    return this.settings.enabled;
  }

  getSettings() {
    return {
      soundEnabled: this.settings.enabled,
      soundVolume: this.settings.volume,
      audioUnlocked: this.audioUnlocked,
    };
  }
}