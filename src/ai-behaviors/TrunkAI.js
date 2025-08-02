import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class TrunkAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);

        this.aggroRadius = this.enemy.ai.aggroRadius || 175;
        this.attackInterval = this.enemy.ai.attackInterval || 2.0;

        this.attackTimer = this.attackInterval * Math.random();
        this.hasFired = false;
        this.state.currentState = 'patrol';
    }

    update(dt) {
        if (this.state.currentState !== 'attacking') {
            this.groundPatrol.update(dt);
        }

        switch (this.state.currentState) {
            case 'idle':
            case 'patrol':
            case 'idle_grounded':
            case 'patrol_grounded':
                this.renderable.animationState = this.state.currentState.startsWith('patrol') ? 'run' : 'idle';
                this.attackTimer -= dt;
                if (this.attackTimer <= 0 && this._isPlayerInRange()) {
                    this.state.currentState = 'attacking';
                    this.renderable.animationState = 'attack';
                    this.renderable.animationFrame = 0;
                    this.renderable.animationTimer = 0;
                    this.hasFired = false;
                }
                break;
            case 'attacking':
                this._updateAttacking(dt);
                break;
        }
    }

    _isPlayerInRange() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (!playerPos) return false;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        if (!playerCol) return false;

        // 1. Check if they are on the same platform
        const enemyEdges = this._getPlatformEdgesForEntity(this.pos, this.col);
        const playerEdges = this._getPlatformEdgesForEntity(playerPos, playerCol);
        const onSamePlatform = enemyEdges && playerEdges && enemyEdges.left === playerEdges.left && enemyEdges.right === playerEdges.right;

        if (!onSamePlatform) {
            return false;
        }

        // 2. Check vertical alignment
        const playerCenterY = playerPos.y + playerCol.height / 2;
        const trunkCenterY = this.pos.y + this.col.height / 2;
        if (Math.abs(playerCenterY - trunkCenterY) > this.col.height * 1.5) {
            return false;
        }

        // 3. Check horizontal distance (aggro range)
        const playerCenterX = playerPos.x + playerCol.width / 2;
        const trunkCenterX = this.pos.x + this.col.width / 2;
        const dx = playerCenterX - trunkCenterX;
        const distance = Math.abs(dx);
        if (distance > this.aggroRadius) {
            return false;
        }

        // 4. Check if facing the player
        const isPlayerRight = dx > 0;
        const isFacingPlayer = (isPlayerRight && this.renderable.direction === 'right') || (!isPlayerRight && this.renderable.direction === 'left');

        return isFacingPlayer;
    }

    _updateAttacking(dt) {
        this.vel.vx = 0;

        const attackAnim = ENEMY_DEFINITIONS.trunk.animations.attack;
        const fireFrame = attackAnim.fireFrame || 8;

        if (this.renderable.animationFrame >= fireFrame && !this.hasFired) {
            this.hasFired = true;
            this._fireBullet();
        }

        const animTimer = this.renderable.animationTimer + dt;
        if (this.renderable.animationFrame >= attackAnim.frameCount - 1 && animTimer >= attackAnim.speed) {
            this.state.currentState = 'patrol';
            this.attackTimer = this.attackInterval;
        }
    }

    _fireBullet() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (!playerPos) return;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        if (!playerCol) return;

        const speed = this.enemy.ai.bullet.speed;
        const bulletSpawnX = this.pos.x + this.col.width / 2;
        const bulletSpawnY = this.pos.y + 5;

        const playerCenterX = playerPos.x + playerCol.width / 2;
        const playerCenterY = playerPos.y + playerCol.height / 2;

        const dx = playerCenterX - bulletSpawnX;
        const dy = playerCenterY - bulletSpawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let velX = 0, velY = 0;
        let rotation = 0;
        if (dist > 0) {
            velX = (dx / dist) * speed;
            velY = (dy / dist) * speed;
            rotation = Math.atan2(dy, dx);
        }

        eventBus.publish('spawnBullet', {
            x: bulletSpawnX,
            y: bulletSpawnY,
            vx: velX,
            vy: velY,
            rotation: rotation,
            config: this.enemy.ai.bullet,
            spriteKey: 'trunk_bullet',
            piecesSpriteKey: 'trunk_bullet_pieces'
        });
        eventBus.publish('playSound', { key: 'bullet_shoot', volume: 0.5, channel: 'SFX' });
    }
}