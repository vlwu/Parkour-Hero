// Utility to create a fallback canvas for assets
function createFallbackCanvas(width, height, color, pattern = true) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  if (pattern) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width / 2, height / 2);
    ctx.fillRect(width / 2, height / 2, width / 2, height / 2);
  }
  return canvas;
}

// Loads a single image with a timeout and fallback
function loadImage(src, key) {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = 10000;
    
    const timer = setTimeout(() => {
      console.warn(`Timeout loading image: ${src}. Using fallback.`);
      let color = '#808080'; // Default grey
      if (key.includes('player')) color = '#ff8c21';
      else if (key.includes('fruit')) color = '#FF6B6B';
      const fallbackCanvas = createFallbackCanvas(32, 32, color);
      img.src = fallbackCanvas.toDataURL();
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      console.error(`Failed to load image: ${src}. Using fallback.`);
      let color = '#808080';
      if (key.includes('player')) color = '#ff8c21';
      else if (key.includes('fruit')) color = '#FF6B6B';
      const fallbackCanvas = createFallbackCanvas(32, 32, color);
      img.src = fallbackCanvas.toDataURL();
    };

    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

// Loads a single sound with a timeout and fallback
function loadSound(src, key) {
  return new Promise((resolve) => {
    const audio = new Audio();
    const timeout = 10000;
    
    const timer = setTimeout(() => {
      console.warn(`Timeout loading sound: ${src}. Using silent fallback.`);
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    }, timeout);
    
    audio.addEventListener('canplaythrough', () => {
      clearTimeout(timer);
      resolve(audio);
    });

    audio.addEventListener('error', () => {
      clearTimeout(timer);
      console.warn(`Failed to load sound: ${src}. Using silent fallback.`);
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    });

    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = src;
  });
}

export async function loadAssets() {
  const imagePaths = {
    backgroundTile: 'assets/Background/Blue.png',
    block: 'assets/Terrain/Terrain.png',
    // Player sprites
    playerJump: 'assets/MainCharacters/PinkMan/jump.png',
    playerDoubleJump: 'assets/MainCharacters/PinkMan/double_jump.png',
    playerIdle: 'assets/MainCharacters/PinkMan/idle.png',
    playerRun: 'assets/MainCharacters/PinkMan/run.png',
    playerFall: 'assets/MainCharacters/PinkMan/fall.png',
    playerDash: 'assets/MainCharacters/PinkMan/dash.png',
    playerCling: 'assets/MainCharacters/PinkMan/wall_jump.png',
    playerAppear: 'assets/MainCharacters/Appearing.png',
    playerDisappear: 'assets/MainCharacters/Disappearing.png',
    // Interactive items
    fruit_apple: 'assets/Items/Fruits/Apple.png',
    fruit_bananas: 'assets/Items/Fruits/Bananas.png',
    fruit_cherries: 'assets/Items/Fruits/Cherries.png',
    fruit_kiwi: 'assets/Items/Fruits/Kiwi.png',
    fruit_melon: 'assets/Items/Fruits/Melon.png',
    fruit_orange: 'assets/Items/Fruits/Orange.png',
    fruit_pineapple: 'assets/Items/Fruits/Pineapple.png',
    fruit_strawberry: 'assets/Items/Fruits/Strawberry.png',
    fruit_collected: 'assets/Items/Fruits/Collected.png',
    checkpoint_inactive: 'assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png',
    checkpoint_activation: 'assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png',
    checkpoint_active: 'assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png',
    trophy: 'assets/Items/Checkpoints/End/End (Pressed).png',
    // Menu assets
    next_level_button: 'assets/Menu/Buttons/Next.png',
    restart_level_button: 'assets/Menu/Buttons/Restart.png',
    previous_level_button: 'assets/Menu/Buttons/Previous.png',
    level_menu_button: 'assets/Menu/Buttons/Levels.png',
    resume_button: 'assets/Menu/Buttons/Play.png',
    settings_button: 'assets/Menu/Buttons/Settings.png',
  };

  const soundPaths = {
    jump: 'assets/Sounds/Player Jump.mp3',
    double_jump: 'assets/Sounds/Player Double Jump.mp3',
    collect: 'assets/Sounds/Fruit Collect.mp3',
    level_complete: 'assets/Sounds/Level Complete.mp3',
    death_sound: 'assets/Sounds/Death.mp3',
    dash: 'assets/Sounds/Whoosh.mp3',
  };

  console.log('Starting asset loading...');

  const imagePromises = Object.entries(imagePaths).map(([key, src]) => 
    loadImage(src, key).then(img => ({ [key]: img }))
  );
  
  const soundPromises = Object.entries(soundPaths).map(([key, src]) => 
    loadSound(src, key).then(audio => ({ [key]: audio }))
  );

  const allPromises = [...imagePromises, ...soundPromises];
  
  try {
    const loadedAssets = await Promise.all(allPromises);
    const assets = Object.assign({}, ...loadedAssets);
    
    console.log('All assets processed. Available assets:', Object.keys(assets).length);
    return assets;
  } catch (error) {
    console.error('A critical error occurred during asset loading:', error);
    throw error;
  }
}