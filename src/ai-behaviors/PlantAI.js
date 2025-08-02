import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';

export class PlantAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.aggroRadius = this.enemy.ai.aggroRadius || 250;
        this.attackInterval = this.enemy.ai.attackInterval || 2.5;

        this.attackTimer = this.attackInterval * Math.random();
        this.hasFired = false;
        this.state.currentState = 'idle';
    }

    update(dt) {
        this.vel.vx = 0;
        this.vel.vy = 0;

        switch (this.state.currentState) {
            case 'idle':
                this._updateIdle(dt);
                break;
            case 'attacking':
                this._updateAttacking(dt);
                break;
        }
    }

    _isPlayerInRange() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (!playerPos) return false;

        const dx = (playerPos.x) - (this.pos.x);
        const dy = (playerPos.y) - (this.pos.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.aggroRadius) return false;

        switch (this.renderable.direction) {
            case 'up': return playerPos.y < this.pos.y && Math.abs(dx) < this.col.width;
            case 'down': return playerPos.y > this.pos.y && Math.abs(dx) < this.col.width;
            case 'left': return playerPos.x < this.pos.x && Math.abs(dy) < this.col.height;
            case 'right': return playerPos.x > this.pos.x && Math.abs(dy) < this.col.height;
            default: return false;
        }
    }

    _updateIdle(dt) {
        this.renderable.animationState = 'idle';

        this.attackTimer -= dt;
        if (this.attackTimer <= 0 && this._isPlayerInRange()) {
            this.state.currentState = 'attacking';
            this.renderable.animationState = 'attack';
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
            this.state.currentState = 'idle';
            this.attackTimer = this.attackInterval;
        }
    }

    _fireBullet() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (!playerPos) return;

        let velX = 0, velY = 0;
        const speed = this.enemy.ai.bullet.speed;
        const bulletSpawnX = this.pos.x + this.col.width / 2;
        const bulletSpawnY = this.pos.y + this.col.height / 2;

        const dx = (playerPos.x + 16) - bulletSpawnX;
        const dy = (playerPos.y + 16) - bulletSpawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            velX = (dx / dist) * speed;
            velY = (dy / dist) * speed;
        }

        eventBus.publish('spawnBullet', {
            x: bulletSpawnX,
            y: bulletSpawnY,
            vx: velX,
            vy: velY,
            config: this.enemy.ai.bullet,
            spriteKey: 'plant_bullet',
            piecesSpriteKey: 'plant_bullet_pieces'
        });
    }
}