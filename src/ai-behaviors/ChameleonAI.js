import { BaseAI } from './BaseAI.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS, EVENTS } from '../utils/constants.js';

class ChameleonAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.state.currentState = ENEMY_STATES.IDLE;
        this.runSpeed = this.enemy.ai.runSpeed || 90;
        this.aggroRange = this.enemy.ai.aggroRange || 350;
        this.attackRange = this.enemy.ai.attackRange || 50;
        this.attackDamage = this.enemy.ai.attackDamage || 50;
        this.attackCooldown = this.enemy.ai.attackCooldown || 1.5;
        this.cooldownTimer = 0;
        this.hasAttacked = false;
    }

    update(dt) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt;
        }

        const playerData = this._getPlayerData();

        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
                this._updateIdle(playerData);
                break;
            case 'chasing':
                this._updateChasing(dt, playerData);
                break;
            case ENEMY_STATES.ATTACKING:
                this._updateAttacking(dt, playerData);
                break;
            case ENEMY_STATES.COOLDOWN:
                this._updateCooldown(dt);
                break;
        }
    }

    _getPlayerData() {
        if (this.playerEntityId === null) return null;
        const playerPos = this.entityManager.getComponent(this.playerEntityId, PositionComponent);
        const playerCol = this.entityManager.getComponent(this.playerEntityId, CollisionComponent);
        return playerPos && playerCol ? { pos: playerPos, col: playerCol } : null;
    }

    _isPlayerOnSamePlatform(playerData) {
        if (!playerData) return false;

        const enemyEdges = this._findPlatformEdges();
        const playerEdges = this._getPlatformEdgesForEntity(playerData.pos, playerData.col);
        const onSamePlatform = enemyEdges && playerEdges && enemyEdges.left === playerEdges.left && enemyEdges.right === playerEdges.right;

        const verticalDistance = Math.abs((playerData.pos.y + playerData.col.height / 2) - (this.pos.y + this.col.height / 2));
        const onSameLevel = verticalDistance < this.col.height * 1.5;

        return onSamePlatform && onSameLevel;
    }

    _updateIdle(playerData) {
        this.vel.vx = 0;
        this.renderable.animationState = ANIMATION_STATES.IDLE;

        if (this.cooldownTimer > 0) return;

        if (this._isPlayerOnSamePlatform(playerData)) {
            const horizontalDistance = Math.abs((playerData.pos.x + playerData.col.width / 2) - (this.pos.x + this.col.width / 2));
            if (horizontalDistance <= this.aggroRange) {
                this.state.currentState = 'chasing';
            }
        }
    }

    _updateChasing(dt, playerData) {
        if (!playerData || !this._isPlayerOnSamePlatform(playerData)) {
            this.state.currentState = ENEMY_STATES.IDLE;
            return;
        }

        const playerCenterX = playerData.pos.x + playerData.col.width / 2;
        const selfCenterX = this.pos.x + this.col.width / 2;
        const horizontalDistance = Math.abs(playerCenterX - selfCenterX);

        if (horizontalDistance <= this.attackRange) {
            this.state.currentState = ENEMY_STATES.ATTACKING;
            this.renderable.animationState = ANIMATION_STATES.ATTACK;
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
            this.hasAttacked = false;
            return;
        }

        if (horizontalDistance > this.aggroRange) {
            this.state.currentState = ENEMY_STATES.IDLE;
            return;
        }

        this.renderable.animationState = ANIMATION_STATES.RUN;
        this.renderable.direction = (playerCenterX > selfCenterX) ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        this.vel.vx = (this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1) * this.runSpeed;
    }

    _updateAttacking(dt, playerData) {
        this.vel.vx = 0;

        const attackAnim = ENEMY_DEFINITIONS.chameleon.animations.attack;
        const fireFrame = attackAnim.fireFrame;

        if (this.renderable.animationFrame >= fireFrame && !this.hasAttacked) {
            this.hasAttacked = true;
            if (playerData) {
                const playerCenterX = playerData.pos.x + playerData.col.width / 2;
                const selfCenterX = this.pos.x + this.col.width / 2;
                const attackReach = this.attackRange + (this.col.width / 2);
                const isPlayerRight = this.renderable.direction === DIRECTIONS.RIGHT;
                const inRangeX = isPlayerRight
                    ? (playerCenterX > selfCenterX && playerCenterX < selfCenterX + attackReach)
                    : (playerCenterX < selfCenterX && playerCenterX > selfCenterX - attackReach);
                
                const verticalDistance = Math.abs((playerData.pos.y + playerData.col.height / 2) - (this.pos.y + this.col.height / 2));
                const inRangeY = verticalDistance < this.col.height;

                if (inRangeX && inRangeY) {
                    eventBus.publish(EVENTS.PLAYER_TOOK_DAMAGE, { amount: this.attackDamage, source: 'chameleon' });
                }
            }
        }

        const animTimer = this.renderable.animationTimer + dt;
        if (this.renderable.animationFrame >= attackAnim.frameCount - 1 && animTimer >= attackAnim.speed) {
             this.state.currentState = ENEMY_STATES.COOLDOWN;
             this.cooldownTimer = this.attackCooldown;
        }
    }

    _updateCooldown(dt) {
        this.vel.vx = 0;
        this.renderable.animationState = ANIMATION_STATES.IDLE;
        if (this.cooldownTimer <= 0) {
            this.state.currentState = ENEMY_STATES.IDLE;
        }
    }
}