import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, EVENTS } from '../utils/constants.js';

export class GhostAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);

        this.enemy.ghostState = ENEMY_STATES.APPEARING;
        this.enemy.phaseTimer = ENEMY_DEFINITIONS.ghost.animations.appear.frameCount * ENEMY_DEFINITIONS.ghost.animations.appear.speed;
        this.renderable.animationState = ANIMATION_STATES.APPEAR;
        this.renderable.animationFrame = 0;

        this.soundRadius = this.enemy.ai.soundRadius || 200;

        this._setVulnerability(false);
    }

    _playSoundIfPlayerNear() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (playerPos) {
            const distance = Math.sqrt(Math.pow(playerPos.x - this.pos.x, 2) + Math.pow(playerPos.y - this.pos.y, 2));
            if (distance < this.soundRadius) {
                eventBus.publish(EVENTS.PLAY_SOUND, { key: 'ghost', volume: 0.5, channel: 'SFX' });
            }
        }
    }

    update(dt) {
        this.enemy.phaseTimer -= dt;
        this.groundPatrol.update(dt);

        switch (this.enemy.ghostState) {
            case ENEMY_STATES.APPEARING:
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = ENEMY_STATES.VISIBLE;
                    this.enemy.phaseTimer = this.enemy.ai.visibleDuration;
                    this.state.currentState = ENEMY_STATES.PATROL;
                    this.renderable.animationState = ANIMATION_STATES.IDLE;
                    this._setVulnerability(true);
                }
                break;

            case ENEMY_STATES.VISIBLE:
                this.renderable.animationState = this.state.currentState === ENEMY_STATES.PATROL ? ANIMATION_STATES.IDLE : ANIMATION_STATES.IDLE;
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = ENEMY_STATES.DISAPPEARING;
                    this.enemy.phaseTimer = ENEMY_DEFINITIONS.ghost.animations.disappear.frameCount * ENEMY_DEFINITIONS.ghost.animations.disappear.speed;
                    this.renderable.animationState = ANIMATION_STATES.DISAPPEAR;
                    this.renderable.animationFrame = 0;
                    this._setVulnerability(false);
                    this._playSoundIfPlayerNear();
                }
                break;

            case ENEMY_STATES.DISAPPEARING:
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = ENEMY_STATES.INVISIBLE;
                    this.enemy.phaseTimer = this.enemy.ai.invisibleDuration;
                    this.renderable.isVisible = false;
                }
                break;

            case ENEMY_STATES.INVISIBLE:
                if (this.enemy.phaseTimer <= 0) {
                    this.enemy.ghostState = ENEMY_STATES.APPEARING;
                    this.enemy.phaseTimer = ENEMY_DEFINITIONS.ghost.animations.appear.frameCount * ENEMY_DEFINITIONS.ghost.animations.appear.speed;
                    this.renderable.animationState = ANIMATION_STATES.APPEAR;
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