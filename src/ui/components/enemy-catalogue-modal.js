import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { eventBus } from '../../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import './bitmap-text.js';

const ENEMY_DESCRIPTIONS = {
    mushroom: "A simple-minded fungus that patrols back and forth on its platform. Be careful not to run into it.",
    chicken: "This feisty fowl stays put until it spots a target on its level. Once provoked, it charges relentlessly.",
    rhino: "A ground enemy that detects the player on the same platform. It charges, accelerating rapidly, and only stops when it hits a wall.",
    snail: "Moves slowly and predictably. A single stomp will cause it fall out of its shell. The shell then continues to bounce around.",
    slime: "Hops along platforms, leaving behind a trail of damaging goo. Time your jumps to avoid both the slime and its puddles.",
    turtle: "A defensive creature. It periodically extends sharp spikes from its shell, making it dangerous to touch. It can only be stomped when its spikes are retracted.",
    bluebird: "Flies in a horizontal pattern, bobbing gently up and down. Its flight path is consistent, making it a predictable obstacle.",
    fatbird: "Hovers in the air until a player passes directly underneath, at which point it slams down to the ground with force.",
    radish: "This vegetable starts by flying around a small area. After being stomped once, it loses its leaves and falls, then begins patrolling on the ground.",
    bee: "Patrols a small area in the air. Periodically stops to shoot a projectile straight down. Can be a threat from above.",
    bat: "Hangs from ceilings and waits. When a player approaches from below, it swoops down to attack. It will return if the player moves too far away.",
    ghost: "A spooky foe that patrols a platform, periodically turning invisible. It cannot be harmed or harm you while invisible.",
    plant: "A stationary plant that shoots projectiles at the player when they enter its line of sight."
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
      max-width: 700px; max-height: 80vh; overflow-y: auto;
      display: flex; flex-direction: column;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }

    .title-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
    }

    .catalogue-container {
      display: flex; flex-direction: column; gap: 20px;
      padding: 10px;
    }

    .enemy-entry {
      background-color: #444;
      border: 1px solid #555;
      border-radius: 8px;
      padding: 15px;
      text-align: left;
    }

    .enemy-title {
      border-bottom: 2px solid #666;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .enemy-description {
      color: #ccc;
      line-height: 1.6;
    }
  `;

  static properties = {
    fontRenderer: { type: Object },
  };

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.fontRenderer) return html``;

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Enemy Catalogue" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="catalogue-container">
            ${map(Object.keys(ENEMY_DEFINITIONS), (enemyId) => html`
              <div class="enemy-entry">
                <div class="enemy-title">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text=${enemyId.charAt(0).toUpperCase() + enemyId.slice(1)} scale="2.2"></bitmap-text>
                </div>
                <p class="enemy-description">${ENEMY_DESCRIPTIONS[enemyId] || 'No behavior description available.'}</p>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('enemy-catalogue-modal', EnemyCatalogueModal);