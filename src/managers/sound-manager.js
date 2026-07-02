import { eventBus } from '../utils/event-bus.js';
import { StorageManager } from './storage-manager.js';

export const MUSIC_TRACKS = [
    { id: 'chickens_meadow', name: 'Chickens In The Meadow', path: '/assets/Sounds/Music/Chickens In The Meadow.ogg' },
    { id: 'cuddle_clouds', name: 'Cuddle Clouds', path: '/assets/Sounds/Music/Cuddle Clouds.ogg' },
    { id: 'drifting_memories', name: 'Drifting Memories', path: '/assets/Sounds/Music/Drifting Memories.ogg' },
    { id: 'evening_harmony', name: 'Evening Harmony', path: '/assets/Sounds/Music/Evening Harmony.ogg' },
    { id: 'floating_dream', name: 'Floating Dream', path: '/assets/Sounds/Music/Floating Dream.ogg' },
    { id: 'forgotten_biomes', name: 'Forgotten Biomes', path: '/assets/Sounds/Music/Forgotten Biomes.ogg' },
    { id: 'gentle_breeze', name: 'Gentle Breeze', path: '/assets/Sounds/Music/Gentle Breeze.ogg' },
    { id: 'golden_gleam', name: 'Golden Gleam', path: '/assets/Sounds/Music/Golden Gleam.ogg' },
    { id: 'pineapple_sea', name: 'Pineapple Under The Sea', path: '/assets/Sounds/Music/Pineapple Under The Sea.ogg' },
    { id: 'polar_lights', name: 'Polar Lights', path: '/assets/Sounds/Music/Polar Lights.ogg' },
    { id: 'sheep', name: 'Sheep', path: '/assets/Sounds/Music/Sheep.ogg' },
    { id: 'strange_worlds', name: 'Strange Worlds', path: '/assets/Sounds/Music/Strange Worlds.ogg' },
    { id: 'sunlight_leaves', name: 'Sunlight Through Leaves', path: '/assets/Sounds/Music/Sunlight Through Leaves.ogg' },
    { id: 'wanderers_tale', name: 'Wanderer\'s Tale', path: '/assets/Sounds/Music/Wanderer\'s Tale.ogg' },
    { id: 'what_clouds', name: 'What Clouds Are Made Of', path: '/assets/Sounds/Music/What Clouds Are Made Of.ogg' },
    { id: 'whispering_woods', name: 'Whispering Woods', path: '/assets/Sounds/Music/Whispering Woods.ogg' },
    { id: 'wildflowers_river', name: 'Wildflowers By The River', path: '/assets/Sounds/Music/Wildflowers By The River.ogg' },
    { id: 'wind_trees', name: 'Wind Over The Trees', path: '/assets/Sounds/Music/Wind Over The Trees.ogg' }
];

export class SoundManager {
  constructor(initialSettings) {
    this.sounds = {};
    this.activeSources = {
      SFX: new Set(),
      UI: new Set(),
      Music: new Set(),
    };
    this.loopingSources = new Map();

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
    } catch(e) {
        console.error("AudioContext not supported", e);
    }

    this.audioUnlocked = false;
    this.settings = initialSettings || {
      enabled: true,
      volume: 0.5,
      musicEnabled: true,
      musicVolume: 0.4,
      currentTrackIndex: 0,
      musicPlaying: false,
    };

    if (this.settings.musicEnabled === undefined) this.settings.musicEnabled = true;
    if (this.settings.musicVolume === undefined) this.settings.musicVolume = 0.4;
    if (this.settings.currentTrackIndex === undefined) this.settings.currentTrackIndex = 0;
    this.settings.musicPlaying = false;

    this.musicAudio = null;
    this.isLevelActive = false;

    this.subscriptions = [];

    this._setupEventSubscriptions();
    this._initializeAudioContext();
  }

  _initializeAudioContext() {
    if (!this.audioContext) return;
    
    const unlock = () => {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.audioUnlocked = true;
                if (this.isLevelActive) this.resumeMusic();
            }).catch(() => {});
        } else if (this.audioContext.state === 'running') {
            this.audioUnlocked = true;
            if (this.isLevelActive) this.resumeMusic();
        }
        
        ['click', 'keydown', 'touchstart'].forEach(evt => {
            document.removeEventListener(evt, unlock, { capture: true });
        });
    };

    ['click', 'keydown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, unlock, { capture: true, once: true });
    });
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

    // Music control integrations
    subscribeAndTrack('levelLoaded', this.onLevelLoaded);
    subscribeAndTrack('gamePaused', this.onGamePaused);
    subscribeAndTrack('gameResumed', this.onGameResumed);
    subscribeAndTrack('levelComplete', this.onLevelComplete);
    subscribeAndTrack('exitToMenu', this.onExitToMenu);

    subscribeAndTrack('toggleMusic', this.toggleMusic);
    subscribeAndTrack('setMusicVolume', ({volume}) => this.setMusicVolume(volume));
    subscribeAndTrack('skipMusic', ({direction}) => this.skipMusic(direction));
    subscribeAndTrack('togglePlayPauseMusic', this.togglePlayPauseMusic);
  }

  _initMusicAudio() {
    if (this.musicAudio) return;
    this.musicAudio = new Audio();
    this.musicAudio.loop = false;
    this.musicAudio.addEventListener('ended', () => {
        this.skipMusic(1);
    });
  }

  getMusicVolume() {
    return this.settings.enabled && this.settings.musicEnabled
      ? this.settings.volume * this.settings.musicVolume
      : 0;
  }

  async playMusic() {
    if (!this.isLevelActive) return;
    this._initMusicAudio();

    const track = MUSIC_TRACKS[this.settings.currentTrackIndex];
    if (!track) return;

    const targetSrc = window.location.origin + track.path;
    if (this.musicAudio.src !== targetSrc) {
        this.musicAudio.src = track.path;
    }

    this.musicAudio.volume = this.getMusicVolume();

    if (this.settings.enabled && this.settings.musicEnabled) {
        if (this.musicAudio.paused) {
            try {
                await this.unlockAudio();
                await this.musicAudio.play();
                this.settings.musicPlaying = true;
            } catch (e) {
                console.log("Music playback blocked or interrupted:", e);
                this.settings.musicPlaying = false;
            }
        } else {
            this.settings.musicPlaying = true;
        }
    } else {
        this.musicAudio.pause();
        this.settings.musicPlaying = false;
    }
    this.publishSettingsUpdate();
  }

  pauseMusic() {
    if (this.musicAudio) {
        this.musicAudio.pause();
    }
    this.settings.musicPlaying = false;
    this.publishSettingsUpdate();
  }

  resumeMusic() {
    if (!this.isLevelActive) return;
    this._initMusicAudio();
    this.musicAudio.volume = this.getMusicVolume();

    if (this.settings.enabled && this.settings.musicEnabled) {
        if (this.musicAudio.paused) {
            this.musicAudio.play().then(() => {
                this.settings.musicPlaying = true;
                this.publishSettingsUpdate();
            }).catch(() => {
                this.settings.musicPlaying = false;
                this.publishSettingsUpdate();
            });
        } else {
            this.settings.musicPlaying = true;
            this.publishSettingsUpdate();
        }
    } else {
        this.settings.musicPlaying = false;
        this.publishSettingsUpdate();
    }
  }

  stopMusic() {
    if (this.musicAudio) {
        this.musicAudio.pause();
        this.musicAudio.currentTime = 0;
    }
    this.settings.musicPlaying = false;
    this.publishSettingsUpdate();
  }

  async setMusicVolume(volume) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicAudio) {
        this.musicAudio.volume = this.getMusicVolume();
    }
    await this.saveSettings();
    this.publishSettingsUpdate();
  }

  async setMusicEnabled(enabled) {
    this.settings.musicEnabled = enabled;
    if (this.musicAudio) {
        this.musicAudio.volume = this.getMusicVolume();
    }
    if (enabled && this.isLevelActive) {
        this.playMusic();
    } else {
        this.pauseMusic();
    }
    await this.saveSettings();
    this.publishSettingsUpdate();
  }

  toggleMusic() {
    this.setMusicEnabled(!this.settings.musicEnabled);
  }

  skipMusic(direction = 1) {
    this.settings.currentTrackIndex = (this.settings.currentTrackIndex + direction + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    if (this.isLevelActive) {
        this.playMusic();
    } else {
        this.publishSettingsUpdate();
    }
    this.saveSettings();
  }

  togglePlayPauseMusic() {
    if (this.settings.musicPlaying) {
        this.pauseMusic();
    } else {
        this.resumeMusic();
    }
  }

  publishSettingsUpdate() {
    eventBus.publish('soundSettingsChanged', {
        enabled: this.settings.enabled,
        volume: this.settings.volume,
        musicEnabled: this.settings.musicEnabled,
        musicVolume: this.settings.musicVolume,
        currentTrackIndex: this.settings.currentTrackIndex,
        musicPlaying: this.settings.musicPlaying,
    });
  }

  onLevelLoaded() {
    this.isLevelActive = true;
    this.playMusic();
  }

  onGamePaused() {
    // Music plays continuously through pause menu/modals
  }

  onGameResumed() {
    if (this.isLevelActive) {
        this.resumeMusic();
    }
  }

  onLevelComplete() {
    // Music plays continuously through level complete menu
  }

  onExitToMenu() {
    this.isLevelActive = false;
    this.stopMusic();
  }

  destroy() {
      this.subscriptions.forEach(({ eventName, callback }) => {
          eventBus.unsubscribe(eventName, callback);
      });
      this.subscriptions = [];
      this.stopAll();
      this.stopMusic();
      if (this.musicAudio) {
          this.musicAudio.src = '';
          this.musicAudio = null;
      }
  }

  async saveSettings() {
      const currentSettings = await StorageManager.loadSettings();
      currentSettings.sound = {
          enabled: this.settings.enabled,
          volume: this.settings.volume,
          musicEnabled: this.settings.musicEnabled,
          musicVolume: this.settings.musicVolume,
          currentTrackIndex: this.settings.currentTrackIndex,
      };
      await StorageManager.saveSettings(currentSettings);
  }

  async addSounds(assets, soundKeys) {
    if (!this.audioContext) return;
    for (const key of soundKeys) {
      if (assets[key] && !this.sounds[key]) {
        try {
          if (assets[key].byteLength > 0) {
              const audioBuffer = await this.audioContext.decodeAudioData(assets[key].slice(0));
              this.sounds[key] = audioBuffer;
          }
        } catch (e) {
          console.error(`Failed to decode audio data for ${key}`, e);
        }
      }
    }
  }

  async play({ key, volumeMultiplier = 1.0, channel = 'SFX', playbackRate = 1.0 }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.activeSources[channel]) {
      return;
    }

    await this.unlockAudio();
    if (!this.audioUnlocked) {
      return;
    }

    try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[key];
        source.playbackRate.value = playbackRate;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);

        this.activeSources[channel].add(source);
        source.onended = () => {
            this.activeSources[channel].delete(source);
            source.disconnect();
            gainNode.disconnect();
        };
    } catch (e) {
        console.error(`Play failed for ${key}:`, e);
    }
  }

  async playLoop({ key, volumeMultiplier = 1.0, channel = 'SFX', playbackRate = 1.0 }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.activeSources[channel]) return;
    if (this.loopingSources.has(key)) return;

    await this.unlockAudio();
    if (!this.audioUnlocked) return;

    try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[key];
        source.loop = true;
        source.playbackRate.value = playbackRate;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);
        
        this.loopingSources.set(key, { source, gainNode, channel });
        this.activeSources[channel].add(source);
    } catch (e) {
        console.error(`Play loop failed for ${key}:`, e);
    }
  }

  stopLoop(soundKey) {
    if (this.loopingSources.has(soundKey)) {
        const { source, gainNode, channel } = this.loopingSources.get(soundKey);
        try {
            source.stop();
            source.disconnect();
            gainNode.disconnect();
        } catch (e) {}
        this.activeSources[channel].delete(source);
        this.loopingSources.delete(soundKey);
    }
  }

  stopAll({ except = [] } = {}) {
    for (const channelName in this.activeSources) {
      if (except.includes(channelName)) continue;
      
      this.activeSources[channelName].forEach(source => {
        try {
            source.stop();
            source.disconnect();
        } catch (e) {}
      });
      this.activeSources[channelName].clear();
    }
    
    for (const [key, data] of this.loopingSources.entries()) {
        if (!except.includes(data.channel)) {
            this.loopingSources.delete(key);
        }
    }
  }

  async unlockAudio() {
    if (!this.audioContext) {
      console.warn("AudioContext not available.");
      this.audioUnlocked = false;
      return;
    }

    if (this.audioContext.state === 'suspended') {
      try {
          await this.audioContext.resume();
      } catch(e) {
          // Ignore errors
      }
    }

    this.audioUnlocked = this.audioContext.state === 'running';
  }

  async setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));

    for (const data of this.loopingSources.values()) {
        data.gainNode.gain.value = this.settings.volume;
    }

    if (this.musicAudio) {
        this.musicAudio.volume = this.getMusicVolume();
    }

    await this.saveSettings();
    this.publishSettingsUpdate();
  }

  async setEnabled(enabled) {
    this.settings.enabled = enabled;
    if (!this.settings.enabled) {
      this.stopAll();
      this.pauseMusic();
    } else {
      if (this.isLevelActive) {
          this.playMusic();
      }
    }
    if (this.musicAudio) {
        this.musicAudio.volume = this.getMusicVolume();
    }
    await this.saveSettings();
    this.publishSettingsUpdate();
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
      musicEnabled: this.settings.musicEnabled,
      musicVolume: this.settings.musicVolume,
      currentTrackIndex: this.settings.currentTrackIndex,
      musicPlaying: this.settings.musicPlaying,
    };
  }
}