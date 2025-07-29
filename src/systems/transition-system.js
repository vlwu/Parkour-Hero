import { eventBus } from '../utils/event-bus.js';

const DIAMOND_SIZE = 128;
const FADE_IN_DURATION = 0.6;
const FADE_OUT_DURATION = 0.6;

export class TransitionSystem {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;
        this.transitionSprite = this.assets.transition;
        this.state = 'idle'; // idle, fading-in, covered, fading-out
        this.progress = 0;
        this.diamonds = [];
        this.onCoverCallback = null;
        this.onCompleteCallback = null;
        this._initializeDiamonds();
    }

    _initializeDiamonds() {
        if (!this.transitionSprite) return;
        const cols = Math.ceil(this.canvas.width / DIAMOND_SIZE) + 2;
        const rows = Math.ceil(this.canvas.height / (DIAMOND_SIZE * 0.75)) + 2;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.diamonds.push({
                    x: (x - 1) * DIAMOND_SIZE + (y % 2 === 0 ? DIAMOND_SIZE / 2 : 0),
                    y: (y - 1) * DIAMOND_SIZE * 0.75,
                    diagonalPos: ((x - 1) * DIAMOND_SIZE) + ((y - 1) * DIAMOND_SIZE * 0.75),
                });
            }
        }
    }

    start(onCover, onComplete) {
        if (this.state !== 'idle') return;
        this.state = 'fading-in';
        this.progress = 0;
        this.onCoverCallback = onCover;
        this.onCompleteCallback = onComplete;
    }

    update(dt) {
        if (this.state === 'idle') return;

        if (this.state === 'fading-in') {
            this.progress += dt / FADE_IN_DURATION;
            if (this.progress >= 1) {
                this.progress = 1;
                this.state = 'covered';
                if (this.onCoverCallback) {
                    this.onCoverCallback().then(() => {
                        this.state = 'fading-out';
                    });
                    this.onCoverCallback = null;
                } else {
                    this.state = 'fading-out';
                }
            }
        } else if (this.state === 'fading-out') {
            this.progress -= dt / FADE_OUT_DURATION;
            if (this.progress <= 0) {
                this.progress = 0;
                this.state = 'idle';
                if (this.onCompleteCallback) {
                    this.onCompleteCallback();
                    this.onCompleteCallback = null;
                }
            }
        }
    }

    render(ctx) {
        if (this.state === 'idle' || !this.transitionSprite) return;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const easedProgress = this.state === 'fading-in' || this.state === 'covered'
            ? 1 - Math.pow(1 - this.progress, 3)
            : this.progress * this.progress * this.progress;

        const maxDiagonal = this.canvas.width + this.canvas.height + DIAMOND_SIZE;
        const waveEdge = maxDiagonal * easedProgress;
        const waveThickness = 400;

        for (const diamond of this.diamonds) {
            const dist = waveEdge - diamond.diagonalPos;
            let scale = 0;

            if (this.state === 'fading-in' || this.state === 'covered') {
                if (dist > 0) {
                    scale = Math.min(1.0, dist / waveThickness);
                }
            } else {
                 scale = Math.max(0, Math.min(1.0, (waveEdge - diamond.diagonalPos) / waveThickness));
            }

            scale = Math.max(0, Math.min(1, scale));

            if (scale > 0.01) {
                const scaledSize = DIAMOND_SIZE * scale;
                ctx.drawImage(
                    this.transitionSprite,
                    diamond.x - scaledSize / 2,
                    diamond.y - scaledSize / 2,
                    scaledSize,
                    scaledSize
                );
            }
        }
        ctx.restore();
    }
}