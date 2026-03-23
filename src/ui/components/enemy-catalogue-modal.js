import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { eventBus } from '../../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import './bitmap-text.js';
import './animated-sprite-card.js';

const ENEMY_DESCRIPTIONS = {
    mushroom: "Patrols platforms back and forth. Simple and predictable.",
    chicken: "Charges relentlessly when it spots you on its level.",
    rhino: "Charges at high speed when you share a platform. Hits walls to stun itself.",
    snail: "Slow mover. Jumping on it leaves a shell that can be kicked.",
    slime: "Hops around and leaves damaging puddles of goo.",
    turtle: "Spiky defender. Only vulnerable when spikes are retracted.",
    bluebird: "Flies in a horizontal wave pattern. Good for bouncing.",
    fatbird: "Hovers and slams down when you pass underneath.",
    radish: "Flies until stomped, then runs on the ground.",
    bee: "Patrols the air and shoots stingers downward.",
    bat: "Hangs on ceilings and swoops down at intruders.",
    ghost: "Patrols and turns invisible. Invulnerable while unseen.",
    plant: "Stationary turret. Shoots projectiles when you are in line of sight.",
    trunk: "Patrols and shoots straight projectiles at you.",
    angrypig: "Slow walk until hit, then runs in a rage.",
    chameleon: "Camouflaged until you get close, then strikes quickly.",
    rock1: "Large rock. Splits into two medium rocks when broken.",
    rock2: "Medium rock. Splits into two small rocks when broken.",
    rock3: "Small rock. Crumbles when broken.",
    skull: "Bounces around. Alternates between fiery (deadly) and cold (vulnerable)."
};

export class EnemyCatalogueModal extends LitElement {
  static styles = css`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 250;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 900px; max-height: 85vh; overflow-y: auto;
      display: flex; flex-direction: column;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer;
      transition: transform 0.2s ease-in-out;
      z-index: 10;
    }
    .close-button:hover { transform: scale(1.1); }

    .title-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
      flex-shrink: 0;
    }

    .catalogue-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      padding: 10px;
    }

    .enemy-title {
      margin-bottom: 8px;
      border-bottom: 1px solid #666;
      width: 100%;
      padding-bottom: 5px;
    }

    .enemy-description {
      color: #ccc;
      font-size: 0.85em;
      line-height: 1.4;
      text-align: center;
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #777; }
  `;

  static properties = {
    fontRenderer: { type: Object },
    assets: { type: Object },
  };

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  _getEnemySprite(enemyId) {
      if (!this.assets) return null;
      // Map enemy ID to asset key based on logic in Renderer/AssetManager
      const def = ENEMY_DEFINITIONS[enemyId];
      if (!def) return null;
      
      let spriteKey = def.spriteKey;
      let animState = 'idle';
      
      // Handle special naming conventions
      if (enemyId === 'radish') animState = 'idle1';
      if (enemyId === 'turtle' || enemyId === 'skull') animState = 'idle1'; // or idle1/idle2
      if (enemyId === 'bluebird') animState = 'flying';
      if (enemyId === 'slime') animState = 'idle_run';
      if (enemyId === 'snail') animState = 'walk';
      if (enemyId === 'angrypig') animState = 'walk';
      
      // Construct asset key like the AssetManager does
      const assetName = `${spriteKey}_${animState}`;
      
      return {
          img: this.assets[assetName],
          frameCount: def.animations[animState]?.frameCount || 1,
          speed: def.animations[animState]?.speed || 0.1
      };
  }

  render() {
    if (!this.fontRenderer || !this.assets) return html``;

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Enemy Catalogue" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="catalogue-grid">
            ${map(Object.keys(ENEMY_DEFINITIONS), (enemyId) => {
              const spriteData = this._getEnemySprite(enemyId);
              return html`
                <animated-sprite-card
                    .sprite=${spriteData?.img}
                    .frameCount=${spriteData?.frameCount}
                    .frameSpeed=${spriteData?.speed}
                >
                    <div class="enemy-title">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${enemyId.charAt(0).toUpperCase() + enemyId.slice(1)} scale="1.5"></bitmap-text>
                    </div>
                    <p class="enemy-description">${ENEMY_DESCRIPTIONS[enemyId] || 'Unknown enemy.'}</p>
                </animated-sprite-card>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('enemy-catalogue-modal', EnemyCatalogueModal);