import { GRID_CONSTANTS } from '../../utils/constants.js';
import { getPaletteColor } from '../config/EditorSettings.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import { DOM } from '../ui/DOM.js';

export class EditorView {
    constructor() {

    }

    renderObjects(objects) {
        DOM.gridContainer.querySelectorAll('.dynamic-object, .chain-link-visual, .trap-path-visual').forEach(el => el.remove());
        objects.forEach(obj => {
            const el = document.createElement('div');
            el.className = 'dynamic-object';
            el.dataset.id = obj.id;
            el.style.width = `${obj.width}px`;
            el.style.height = `${obj.height}px`;
            el.style.left = `${obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.width / 2)}px`;
            el.style.top = `${obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.height / 2)}px`;
            el.title = obj.type;
            el.style.backgroundColor = getPaletteColor(obj.type);
            el.style.opacity = '0.8';
            let angle = 0;
            if (obj.type === 'fan' || obj.type === 'plant') {
                switch (obj.direction) {
                    case 'up': angle = 0; break; case 'right': angle = 90; break;
                    case 'down': angle = 180; break; case 'left': angle = -90; break;
                    default: angle = 90; break;
                }
            } else if (obj.type === 'arrow_bubble') {
                switch (obj.direction) {
                    case 'up': angle = 0; break;
                    case 'left': angle = -90; break;
                    case 'down': angle = 180; break;
                    case 'right': default: angle = 90; break;
                }
            }
            el.style.transform = `rotate(${angle}deg)`;
            if (obj.type === 'player_spawn') {
                el.innerHTML = '<span style="color: white; font-weight: bold; font-size: 18px;">P</span>';
                el.style.display = 'flex'; el.style.justifyContent = 'center'; el.style.alignItems = 'center';
            }
            DOM.gridContainer.appendChild(el);

            if (obj.type === 'fire_trap' && obj.chainLength > 1) {
                const startX = obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.width / 2);
                const startY = obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.height / 2);

                for (let i = 1; i < obj.chainLength; i++) {
                    const visualEl = document.createElement('div');
                    visualEl.className = 'chain-link-visual';
                    visualEl.style.position = 'absolute';
                    visualEl.style.pointerEvents = 'none';
                    visualEl.style.width = `${obj.width}px`;
                    visualEl.style.height = `${obj.height}px`;
                    visualEl.style.left = `${startX + i * obj.width}px`;
                    visualEl.style.top = `${startY}px`;
                    visualEl.style.backgroundColor = getPaletteColor(obj.type);
                    visualEl.style.opacity = '0.7';
                    visualEl.style.boxSizing = 'border-box';
                    visualEl.style.border = '1px dashed rgba(255, 255, 255, 0.4)';
                    DOM.gridContainer.appendChild(visualEl);
                }
            }

            if (obj.type === 'saw' || obj.type === 'brown_platform' || obj.type === 'grey_platform') {
                const line = document.createElement('div');
                line.className = 'trap-path-visual';
                line.style.position = 'absolute';
                line.style.backgroundColor = 'rgba(0,0,0,0.7)';
                line.style.pointerEvents = 'none';
                line.style.zIndex = '-1';

                const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
                const distance = obj.distance || 100;

                let direction = obj.direction;
                if (obj.type === 'brown_platform') direction = 'horizontal';
                if (obj.type === 'grey_platform') direction = 'vertical';

                if (direction === 'horizontal') {
                    line.style.left = `${obj.x * TILE_SIZE - distance / 2}px`;
                    line.style.top = `${obj.y * TILE_SIZE - 1}px`;
                    line.style.width = `${distance}px`;
                    line.style.height = `2px`;
                } else {
                    line.style.left = `${obj.x * TILE_SIZE - 1}px`;
                    line.style.top = `${obj.y * TILE_SIZE - distance / 2}px`;
                    line.style.width = `2px`;
                    line.style.height = `${distance}px`;
                }
                DOM.gridContainer.appendChild(line);
            }

            if (obj.type === 'spiked_ball') {
                const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
                const chainLength = obj.chainLength || 100;
                const swingArc = obj.swingArc || 90;
                const maxAngleRad = (swingArc / 2) * (Math.PI / 180);

                const createLine = (angleRad, color, width) => {
                    const line = document.createElement('div');
                    line.className = 'trap-path-visual';
                    line.style.position = 'absolute';
                    line.style.backgroundColor = color;
                    line.style.width = `${width}px`;
                    line.style.height = `${chainLength}px`;
                    line.style.left = `${obj.x * TILE_SIZE}px`;
                    line.style.top = `${obj.y * TILE_SIZE}px`;
                    line.style.transformOrigin = 'top center';
                    line.style.transform = `rotate(${angleRad}rad)`;
                    line.style.pointerEvents = 'none';
                    line.style.zIndex = '-1';
                    return line;
                };

                DOM.gridContainer.appendChild(createLine(0, 'rgba(0,0,0,0.7)', 2));
                DOM.gridContainer.appendChild(createLine(-maxAngleRad, 'rgba(255,0,0,0.4)', 1));
                DOM.gridContainer.appendChild(createLine(maxAngleRad, 'rgba(255,0,0,0.4)', 1));
            }

            if (obj.type === 'bluebird') {
                const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
                const patrolDistance = obj.patrolDistance || ENEMY_DEFINITIONS.bluebird.ai.patrolDistance;
                const verticalAmplitude = obj.verticalAmplitude || ENEMY_DEFINITIONS.bluebird.ai.verticalAmplitude;


                const box = document.createElement('div');
                box.className = 'trap-path-visual';
                box.style.position = 'absolute';
                box.style.pointerEvents = 'none';
                box.style.zIndex = '-1';
                box.style.left = `${obj.x * TILE_SIZE - patrolDistance / 2}px`;
                box.style.top = `${obj.y * TILE_SIZE - verticalAmplitude}px`;
                box.style.width = `${patrolDistance}px`;
                box.style.height = `${verticalAmplitude * 2}px`;
                box.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                box.style.border = '1px dashed rgba(255, 255, 255, 0.4)';
                box.style.boxSizing = 'border-box';
                DOM.gridContainer.appendChild(box);


                const centerLine = document.createElement('div');
                centerLine.className = 'trap-path-visual';
                centerLine.style.position = 'absolute';
                centerLine.style.pointerEvents = 'none';
                centerLine.style.zIndex = '-1';
                centerLine.style.left = `${obj.x * TILE_SIZE - patrolDistance / 2}px`;
                centerLine.style.top = `${obj.y * TILE_SIZE - 1}px`;
                centerLine.style.width = `${patrolDistance}px`;
                centerLine.style.height = `2px`;
                centerLine.style.backgroundColor = 'rgba(0,0,0,0.5)';
                DOM.gridContainer.appendChild(centerLine);
            }

            if (obj.type === 'radish' || obj.type === 'bee') {
                const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
                const patrolBoxSize = obj.patrolBoxSize || ENEMY_DEFINITIONS[obj.type].ai.patrolBoxSize;

                const box = document.createElement('div');
                box.className = 'trap-path-visual';
                box.style.position = 'absolute';
                box.style.pointerEvents = 'none';
                box.style.zIndex = '-1';
                box.style.left = `${obj.x * TILE_SIZE - patrolBoxSize / 2}px`;
                box.style.top = `${obj.y * TILE_SIZE - patrolBoxSize / 2}px`;
                box.style.width = `${patrolBoxSize}px`;
                box.style.height = `${patrolBoxSize}px`;
                box.style.backgroundColor = 'rgba(255, 99, 71, 0.1)';
                box.style.border = '1px dashed rgba(255, 255, 255, 0.4)';
                box.style.boxSizing = 'border-box';
                DOM.gridContainer.appendChild(box);
            }
        });
    }
}