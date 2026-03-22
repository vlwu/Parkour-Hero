const STOMP_BOUNCE_VELOCITY = 250;

export const ENEMY_DEFINITIONS = {

    mushroom: {
        width: 32,
        height: 32,
        spriteKey: 'mushroom',
        animations: {
            idle: { frameCount: 14, speed: 0.1 },
            run: { frameCount: 16, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'patrol',
            aggroRange: 0,
            patrolSpeed: 40,
            idleTime: 0.5,
            particleDropInterval: 0.4,
        },
        assets: {
            mushroom_hit: '/assets/Enemies/Mushroom/Hit.png',
            mushroom_idle: '/assets/Enemies/Mushroom/Idle.png',
            mushroom_run: '/assets/Enemies/Mushroom/Run.png'
        }
    },

    chicken: {
        width: 32,
        height: 34,
        hitbox: {
            width: 25,
            height: 34,
        },
        spriteKey: 'chicken',
        animations: {
            idle: { frameCount: 13, speed: 0.1 },
            run: { frameCount: 14, speed: 0.05 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'ground_charge',
            aggroRange: 300,
            chargeSpeed: 130,
            idleTime: 1.,
            chargeTime: 2.0,
            cooldownTime: 1.0,
        },
        assets: {
            chicken_hit: '/assets/Enemies/Chicken/Hit.png',
            chicken_idle: '/assets/Enemies/Chicken/Idle.png',
            chicken_run: '/assets/Enemies/Chicken/Run.png'
        }
    },

    rhino: {
        width: 52,
        height: 34,
        spriteKey: 'rhino',
        animations: {
            idle: { frameCount: 11, speed: 0.1 },
            run: { frameCount: 6, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 },
            wall_hit: { frameCount: 4, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: (enemyId, entityManager) => {
                const vel = entityManager.getComponent(enemyId, 'VelocityComponent');
                if (vel && Math.abs(vel.vx) > 80) {
                    return 1000;
                }
                return 30;
            },
        },
        ai: {
            type: 'rhino',
            aggroRange: 750,
            initialSpeed: 80,
            acceleration: 80,
            maxSpeed: 500,
            reboundSpeed: 50,
            stunDuration: 1.2,
        },
        assets: {
            rhino_hit: '/assets/Enemies/Rhino/Hit.png',
            rhino_idle: '/assets/Enemies/Rhino/Idle.png',
            rhino_run: '/assets/Enemies/Rhino/Run.png',
            rhino_wall_hit: '/assets/Enemies/Rhino/Wall Hit.png'
        }
    },

    snail: {
        width: 38,
        height: 24,
        spriteKey: 'snail',
        animations: {
            idle: { frameCount: 15, speed: 0.2 },
            walk: { frameCount: 10, speed: 0.15 },
            shell_idle: { frameCount: 6, speed: 0.1 },
            shell_wall_hit: { frameCount: 4, speed: 0.05 },
            shell_top_hit: { frameCount: 5, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'snail',
            patrolSpeed: 20,
            shellSpeed: 150,
            wallHitStunTime: 0.2,
            particleDropInterval: 0.45,
        },
        behavior: { type: 'shell' },
        assets: {
            snail_hit: '/assets/Enemies/Snail/Hit.png',
            snail_idle: '/assets/Enemies/Snail/Idle.png',
            snail_walk: '/assets/Enemies/Snail/Walk.png',
            snail_die: '/assets/Enemies/Snail/Snail without shell.png',
            snail_shell_idle: '/assets/Enemies/Snail/Shell Idle.png',
            snail_shell_top_hit: '/assets/Enemies/Snail/Shell Top Hit.png',
            snail_shell_wall_hit: '/assets/Enemies/Snail/Shell Wall Hit.png'
        }
    },

    slime: {
        width: 44,
        height: 30,
        hitbox: {
            width: 36,
            height: 30,
        },
        spriteKey: 'slime',
        animations: {
            idle_run: { frameCount: 10, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 },
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'patrol',
            patrolSpeed: 25,
            particleDropInterval: 0.3,
        },
        assets: {
            slime_hit: '/assets/Enemies/Slime/Hit.png',
            slime_idle_run: '/assets/Enemies/Slime/Idle-Run.png',
            slime_particles: '/assets/Enemies/Slime/Particles.png'
        }
    },

    turtle: {
        width: 44,
        height: 26,
        hitbox: {
            width: 30,
            height: 20,
        },
        spriteKey: 'turtle',
        animations: {
            idle1: { frameCount: 14, speed: 0.1 },
            idle2: { frameCount: 14, speed: 0.1 },
            spikes_out: { frameCount: 8, speed: 0.1 },
            spikes_in: { frameCount: 8, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'defensive_cycle',
            spikesInDuration: 2.0,
            spikesOutDuration: 3.0,
        },
        assets: {
            turtle_hit: '/assets/Enemies/Turtle/Hit.png',
            turtle_idle1: '/assets/Enemies/Turtle/Idle 1.png',
            turtle_idle2: '/assets/Enemies/Turtle/Idle 2.png',
            turtle_spikes_in: '/assets/Enemies/Turtle/Spikes in.png',
            turtle_spikes_out: '/assets/Enemies/Turtle/Spikes out.png'
        }
    },

    bluebird: {
        width: 32,
        height: 32,
        spriteKey: 'bluebird',
        animations: {
            flying: { frameCount: 9, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'flying_patrol',
            patrolDistance: 200,
            horizontalSpeed: 60,
            verticalAmplitude: 10,
            verticalFrequency: 2,
            gravity: 80,
            flapForce: -100,
            tetherStrength: 5,
            turnDuration: 1,
            acceleration: 120,
        },
        assets: {
            bluebird_flying: '/assets/Enemies/BlueBird/Flying.png',
            bluebird_hit: '/assets/Enemies/BlueBird/Hit.png'
        }
    },

    fatbird: {
        width: 40,
        height: 48,
        spriteKey: 'fatbird',
        animations: {
            idle: { frameCount: 8, speed: 0.08 },
            fall: { frameCount: 4, speed: 0.1 },
            ground: { frameCount: 4, speed: 0.25 },
            hit: { frameCount: 5, speed: 0.1 },
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: false,
            contactDamage: 1000,
        },
        ai: {
            type: 'flying_slam',
            bobbingAmplitude: 8,
            gravity: 120,
            flapForce: -140,
            tetherStrength: 5,
            slamSpeed: 275,
            retractSpeed: 100,
            groundedDuration: 1.0,
        },
        assets: {
            fatbird_hit: '/assets/Enemies/FatBird/Hit.png',
            fatbird_idle: '/assets/Enemies/FatBird/Idle.png',
            fatbird_fall: '/assets/Enemies/FatBird/Fall.png',
            fatbird_ground: '/assets/Enemies/FatBird/Ground.png'
        }
    },

    radish: {
        width: 30,
        height: 38,
        hitbox: {
            width: 20,
            height: 38,
        },
        spriteKey: 'radish',
        animations: {
            idle1: { frameCount: 6, speed: 0.1 },
            idle2: { frameCount: 9, speed: 0.1 },
            run: { frameCount: 12, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: 1000,
        },
        ai: {
            type: 'radish',
            patrolBoxSize: 150,
            airSpeed: 40,
            groundSpeed: 30,
            idleTime: 1.0,
            particleDropInterval: 0.3,
        },
        behavior: { type: 'fall' },
        assets: {
            radish_hit: '/assets/Enemies/Radish/Hit.png',
            radish_idle1: '/assets/Enemies/Radish/Idle 1.png',
            radish_idle2: '/assets/Enemies/Radish/Idle 2.png',
            radish_leaves: '/assets/Enemies/Radish/Leaves.png',
            radish_run: '/assets/Enemies/Radish/Run.png'
        }
    },

    bee: {
        width: 36,
        height: 34,
        spriteKey: 'bee',
        animations: {
            idle: { frameCount: 6, speed: 0.05 },
            attack: { frameCount: 8, speed: 0.08, fireFrame: 4 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: 1000,
        },
        ai: {
            type: 'bee',
            patrolBoxSize: 150,
            airSpeed: 60,
            attackInterval: 2.0,
            bullet: {
                speed: 200,
                damage: 50,
                width: 16,
                height: 16,
            }
        },
        assets: {
            bee_hit: '/assets/Enemies/Bee/Hit.png',
            bee_attack: '/assets/Enemies/Bee/Attack.png',
            bee_idle: '/assets/Enemies/Bee/Idle.png',
            bee_bullet: '/assets/Enemies/Bee/Bullet.png',
            bee_bullet_pieces: '/assets/Enemies/Bee/Bullet Pieces.png'
        }
    },

    bat: {
        width: 46,
        height: 30,
        spriteKey: 'bat',
        animations: {
            idle: { frameCount: 12, speed: 0.1 },
            ceiling_out: { frameCount: 7, speed: 0.1 },
            flying: { frameCount: 7, speed: 0.1 },
            ceiling_in: { frameCount: 7, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'bat',
            aggroRadius: 150,
            deaggroRadius: 300,
            flyingSpeed: 35,
        },
        assets: {
            bat_hit: '/assets/Enemies/Bat/Hit.png',
            bat_idle: '/assets/Enemies/Bat/Idle.png',
            bat_ceiling_in: '/assets/Enemies/Bat/Ceiling In.png',
            bat_ceiling_out: '/assets/Enemies/Bat/Ceiling Out.png',
            bat_flying: '/assets/Enemies/Bat/Flying.png'
        }
    },

    ghost: {
        width: 44,
        height: 30,
        spriteKey: 'ghost',
        animations: {
            idle: { frameCount: 10, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 },
            appear: { frameCount: 4, speed: 0.1 },
            disappear: { frameCount: 4, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'ghost',
            patrolSpeed: 40,
            idleTime: 0.5,
            visibleDuration: 2.0,
            invisibleDuration: 2.0,
            particleDropInterval: 0.2,
            soundRadius: 200,
        },
        assets: {
            ghost_hit: '/assets/Enemies/Ghost/Hit.png',
            ghost_idle: '/assets/Enemies/Ghost/Idle.png',
            ghost_appear: '/assets/Enemies/Ghost/Appear.png',
            ghost_disappear: '/assets/Enemies/Ghost/Disappear.png',
            ghost_particles: '/assets/Enemies/Ghost/Ghost Particles.png'
        }
    },

    plant: {
        width: 44,
        height: 42,
        hitbox: {
            width: 37,
            height: 42,
        },
        spriteKey: 'plant',
        animations: {
            idle: { frameCount: 11, speed: 0.1 },
            attack: { frameCount: 8, speed: 0.1, fireFrame: 5 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: 1000,
        },
        ai: {
            type: 'plant',
            aggroRadius: 250,
            attackInterval: 0.3,
            bullet: {
                speed: 250,
                damage: 50,
                width: 16,
                height: 16,
            }
        },
        assets: {
            plant_hit: '/assets/Enemies/Plant/Hit.png',
            plant_attack: '/assets/Enemies/Plant/Attack.png',
            plant_idle: '/assets/Enemies/Plant/Idle.png',
            plant_bullet: '/assets/Enemies/Plant/Bullet.png',
            plant_bullet_pieces: '/assets/Enemies/Plant/Bullet Pieces.png'
        }
    },
    trunk: {
        width: 64,
        height: 32,
        hitbox: {
            width: 40,
            height: 32,
        },
        spriteKey: 'trunk',
        animations: {
            idle: { frameCount: 18, speed: 0.1 },
            attack: { frameCount: 11, speed: 0.1, fireFrame: 8 },
            hit: { frameCount: 5, speed: 0.1 },
            run: { frameCount: 14, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: 1000,
        },
        ai: {
            type: 'trunk',
            patrolSpeed: 45,
            idleTime: 1,
            attackInterval: 1.5,
            particleDropInterval: 0.3,
            bullet: {
                speed: 250,
                damage: 50,
                width: 16,
                height: 16,
            }
        },
        assets: {
            trunk_hit: '/assets/Enemies/Trunk/Hit.png',
            trunk_idle: '/assets/Enemies/Trunk/Idle.png',
            trunk_run: '/assets/Enemies/Trunk/Run.png',
            trunk_attack: '/assets/Enemies/Trunk/Attack.png',
            trunk_bullet: '/assets/Enemies/Trunk/Bullet.png',
            trunk_bullet_pieces: '/assets/Enemies/Trunk/Bullet Pieces.png'
        }
    },
    angrypig: {
        width: 36,
        height: 30,
        spriteKey: 'angrypig',
        animations: {
            idle: { frameCount: 9, speed: 0.1 },
            hit1: { frameCount: 5, speed: 0.1 },
            hit2: { frameCount: 5, speed: 0.1 },
            run: { frameCount: 12, speed: 0.05 },
            walk: { frameCount: 16, speed: 0.05 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: 1000,
        },
        ai: {
            type: 'angrypig',
            walkSpeed: 60,
            runSpeed: 150,
            idleTime: 0.5,
            particleDropInterval: 0.3,
        },
        behavior: { type: 'rage' },
        assets: {
            angrypig_hit1: '/assets/Enemies/AngryPig/Hit 1.png',
            angrypig_hit2: '/assets/Enemies/AngryPig/Hit 2.png',
            angrypig_idle: '/assets/Enemies/AngryPig/Idle.png',
            angrypig_run: '/assets/Enemies/AngryPig/Run.png',
            angrypig_walk: '/assets/Enemies/AngryPig/Walk.png'
        }
    },
    chameleon: {
        width: 84,
        height: 38,
        hitbox: {
            width: 32,
            height: 38,
        },
        spriteKey: 'chameleon',
        animations: {
            hit: { frameCount: 5, speed: 0.1 },
            idle: { frameCount: 13, speed: 0.1 },
            run: { frameCount: 8, speed: 0.05 },
            attack: { frameCount: 10, speed: 0.1, fireFrame: 7 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: 1000,
        },
        ai: {
            type: 'chameleon',
            runSpeed: 90,
            aggroRange: 350,
            attackRange: 80,
            attackDamage: 50,
        },
        assets: {
            chameleon_hit: '/assets/Enemies/Chameleon/Hit.png',
            chameleon_idle: '/assets/Enemies/Chameleon/Idle.png',
            chameleon_run: '/assets/Enemies/Chameleon/Run.png',
            chameleon_attack: '/assets/Enemies/Chameleon/Attack.png'
        }
    },
    rock1: {
        width: 38,
        height: 34,
        spriteKey: 'rock1',
        animations: {
            idle: { frameCount: 14, speed: 0.1 },
            run: { frameCount: 14, speed: 0.1 },
            hit: { frameCount: 1, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'rock',
            patrolSpeed: 40,
            idleTime: 0.5,
            particleDropInterval: 0.35,
        },
        behavior: { type: 'split', splitInto: 'rock2' },
        assets: {
            rock1_hit: '/assets/Enemies/Rocks/Rock1 Hit.png',
            rock1_idle: '/assets/Enemies/Rocks/Rock1 Idle.png',
            rock1_run: '/assets/Enemies/Rocks/Rock1 Run.png'
        }
    },
    rock2: {
        width: 32,
        height: 28,
        spriteKey: 'rock2',
        animations: {
            idle: { frameCount: 13, speed: 0.1 },
            run: { frameCount: 14, speed: 0.1 },
            hit: { frameCount: 1, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'rock',
            patrolSpeed: 50,
            idleTime: 0.5,
            particleDropInterval: 0.3,
        },
        behavior: { type: 'split', splitInto: 'rock3' },
        assets: {
            rock2_hit: '/assets/Enemies/Rocks/Rock2 Hit.png',
            rock2_idle: '/assets/Enemies/Rocks/Rock2 Idle.png',
            rock2_run: '/assets/Enemies/Rocks/Rock2 Run.png'
        }
    },
    rock3: {
        width: 22,
        height: 18,
        spriteKey: 'rock3',
        animations: {
            idle: { frameCount: 11, speed: 0.1 },
            run: { frameCount: 14, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            contactDamage: 1000,
        },
        ai: {
            type: 'rock',
            patrolSpeed: 60,
            idleTime: 0.5,
            particleDropInterval: 0.25,
        },
        assets: {
            rock3_hit: '/assets/Enemies/Rocks/Rock3 Hit.png',
            rock3_idle: '/assets/Enemies/Rocks/Rock3 Idle.png',
            rock3_run: '/assets/Enemies/Rocks/Rock3 Run.png'
        }
    },
    skull: {
        width: 52,
        height: 54,
        hitbox: {
            width: 42,
            height: 44,
        },
        spriteKey: 'skull',
        animations: {
            idle1: { frameCount: 8, speed: 0.1 },
            idle2: { frameCount: 8, speed: 0.1 },
            hit_wall_1: { frameCount: 7, speed: 0.1 },
            hit_wall_2: { frameCount: 7, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: false,
            stompBounceVelocity: STOMP_BOUNCE_VELOCITY,
            dealsContactDamage: true,
            contactDamage: 1000,
        },
        ai: {
            type: 'skull',
            bounceSpeed: 50,
            soundRadius: 200,
        },
        assets: {
            skull_hit: '/assets/Enemies/Skull/Hit.png',
            skull_hit_wall_1: '/assets/Enemies/Skull/Hit Wall 1.png',
            skull_hit_wall_2: '/assets/Enemies/Skull/Hit Wall 2.png',
            skull_idle1: '/assets/Enemies/Skull/Idle 1.png',
            skull_idle2: '/assets/Enemies/Skull/Idle 2.png',
            skull_orange_particle: '/assets/Enemies/Skull/Orange Particle.png',
            skull_red_particle: '/assets/Enemies/Skull/Red Particle.png'
        }
    }
};