import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';

export class GhostAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);

        this.enemy.ghostState = 'appearing';
        this.enemy.phaseTimer = ENEMY_DEFINITIONS.ghost.animations.appear.frameCount * ENEMY_DEFINITIONS.ghost.animations.appear.speed;
        this.renderable.animationState = 'appear';
        this.renderable.animationFrame = 0;

        this.soundRadius = this.enemy.ai.soundRadius || 200;

        this._setVulnerability(false);
    }

    _playSoundIfPlayerNear() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (playerPos) {
            const distance = Math.sqrt(Math.pow(playerPos.x - this.pos.x, 2) + Math.pow(playerPos.y - this.pos.y, 2));
            if (distance < this.soundRadius) {
                eventBus.publish('playSound', { key: 'ghost', volume: 0.5, channel: 'SFX' });
            }
        }
    }

    update(dt) {
        this.enemy.phaseTimer -= dt;
        this.groundPatrol.update(dt);

        switch (this.enemy.ghostState) {
            case 'appearing':
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = 'visible';
                    this.enemy.phaseTimer = this.enemy.ai.visibleDuration;
                    this.state.currentState = 'patrol';
                    this.renderable.animationState = 'idle';
                    this._setVulnerability(true);
                }
                break;

            case 'visible':
                this.renderable.animationState = this.state.currentState === 'patrol' ? 'idle' : 'idle';
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = 'disappearing';
                    this.enemy.phaseTimer = ENEMY_DEFINITIONS.ghost.animations.disappear.frameCount * ENEMY_DEFINITIONS.ghost.animations.disappear.speed;
                    this.renderable.animationState = 'disappear';
                    this.renderable.animationFrame = 0;
                    this._setVulnerability(false);
                    this._playSoundIfPlayerNear();
                }
                break;

            case 'disappearing':
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = 'invisible';
                    this.enemy.phaseTimer = this.enemy.ai.invisibleDuration;
                    this.renderable.isVisible = false;
                }
                break;

            case 'invisible':
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = 'appearing';
                    this.enemy.phaseTimer = ENEMY_DEFINITIONS.ghost.animations.appear.frameCount * ENEMY_DEFINITIONS.ghost.animations.appear.speed;
                    this.renderable.animationState = 'appear';
                    this.renderable.animationFrame = 0;
                    this.renderable.isVisible = true;
                    this._playSoundIfPlayerNear();
                }
                break;
        }
    }

    _setVulnerability(isVulnerable) {
        this.killable.dealsContactDamage = isVulnerable;
        this.killable.stompable = isVulnerable;
        this.col.solid = isVulnerable;
    }
}