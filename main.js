import { Engine } from './core/engine.js';
import { loadAssets } from './core/assets.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Desired base resolution
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

// Maintain 16:9 aspect ratio and center canvas
function resizeCanvas() {
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
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

loadAssets().then((assets) => {
  const engine = new Engine(ctx, canvas, assets);
  engine.start();
}).catch((err) => {
  console.error("Asset loading failed:", err);
});
