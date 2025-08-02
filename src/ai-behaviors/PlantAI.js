import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, EVENTS, DIRECTIONS } from '../utils/constants.js';

export class PlantAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.aggroRadius = this.enemy.ai.aggroRadius || 250;
        this.attackInterval = this.enemy.ai.attackInterval || 2.5;

        this.attackTimer = this.attackInterval * Math.random();
        this.hasFired = false;
        this.state.currentState = ENEMY_STATES.IDLE;
    }

    update(dt) {
        this.vel.vx = 0;
        this.vel.vy = 0;

        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
                this._updateIdle(dt);
                break;
            case ENEMY_STATES.ATTACKING:
                this._updateAttacking(dt);
                break;
        }
    }

    _isPlayerInRange() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (!playerPos) return false;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        if (!playerCol) return false;

        const playerCenterX = playerPos.x + playerCol.width / 2;
        const playerCenterY = playerPos.y + playerCol.height / 2;
        const plantCenterX = this.pos.x + this.col.width / 2;
        const plantCenterY = this.pos.y + this.col.height / 2;

        const dx = playerCenterX - plantCenterX;
        const dy = playerCenterY - plantCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.aggroRadius) return false;

        switch (this.renderable.direction) {
            case DIRECTIONS.UP: return playerCenterY < plantCenterY && Math.abs(dx) < this.col.width / 2;
            case DIRECTIONS.DOWN: return playerCenterY > plantCenterY && Math.abs(dx) < this.col.width / 2;
            case DIRECTIONS.LEFT: return playerCenterX < plantCenterX && Math.abs(dy) < this.col.height / 2;
            case DIRECTIONS.RIGHT: return playerCenterX > plantCenterX && Math.abs(dy) < this.col.height / 2;
            default: return false;
        }
    }

    _updateIdle(dt) {
        this.renderable.animationState = ANIMATION_STATES.IDLE;

        this.attackTimer -= dt;
        if (this.attackTimer <= 0 && this._isPlayerInRange()) {
            this.state.currentState = ENEMY_STATES.ATTACKING;
            this.renderable.animationState = ANIMATION_STATES.ATTACK;
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
            this.hasFired = false;
        }
    }

    _updateAttacking(dt) {
        const attackAnim = ENEMY_DEFINITIONS.plant.animations.attack;
        const fireFrame = attackAnim.fireFrame || 5;

        if (this.renderable.animationFrame >= fireFrame && !this.hasFired) {
            this.hasFired = true;
            this._fireBullet();
        }

        const animTimer = this.renderable.animationTimer + dt;
        if (this.renderable.animationFrame >= attackAnim.frameCount - 1 && animTimer >= attackAnim.speed) {
            this.state.currentState = ENEMY_STATES.IDLE;
            this.attackTimer = this.attackInterval;
        }
    }

    _fireBullet() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (!playerPos) return;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        if (!playerCol) return;

        let velX = 0, velY = 0;
        const speed = this.enemy.ai.bullet.speed;
        const bulletSpawnX = this.pos.x + this.col.width / 2;
        const bulletSpawnY = this.pos.y + 10;

        const playerCenterX = playerPos.x + playerCol.width / 2;
        const playerCenterY = playerPos.y + playerCol.height / 2;

        const dx = playerCenterX - bulletSpawnX;
        const dy = playerCenterY - bulletSpawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            velX = (dx / dist) * speed;
            velY = (dy / dist) * speed;
        }

        eventBus.publish(EVENTS.SPAWN_BULLET, {
            x: bulletSpawnX,
            y: bulletSpawnY,
            vx: velX,
            vy: velY,
            config: this.enemy.ai.bullet,
            spriteKey: 'plant_bullet',
            piecesSpriteKey: 'plant_bullet_pieces'
        });
        eventBus.publish(EVENTS.PLAY_SOUND, { key: 'bullet_shoot', volume: 0.5, channel: 'SFX' });
    }
}