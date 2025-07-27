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
            stompBounceVelocity: 300,
            contactDamage: 1000,
        },
        ai: {
            type: 'patrol',
            aggroRange: 0,
            patrolSpeed: 40,
        }
    },

    chicken: {
        width: 32,
        height: 34,
        spriteKey: 'chicken',
        animations: {
            idle: { frameCount: 13, speed: 0.1 },
            run: { frameCount: 14, speed: 0.08 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 250,
            contactDamage: 1000,
        },
        ai: {
            type: 'ground_charge',
            aggroRange: 250,
            chargeSpeed: 200,
            idleTime: 1.5,
            chargeTime: 2.0,
            cooldownTime: 1.0,
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
            stompBounceVelocity: 250,
            contactDamage: 1000,
        },
        ai: {
            type: 'snail',
            patrolSpeed: 20,
            shellSpeed: 150,
        }
    },

    slime: {
        width: 44,
        height: 30,
        spriteKey: 'slime',
        animations: {
            idle_run: { frameCount: 10, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 },
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 350,
            contactDamage: 1000,
        },
        ai: {
            type: 'patrol',
            patrolSpeed: 25,
            particleDropInterval: 0.3,
        }
    },

    turtle: {
        width: 44,
        height: 26,
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
            stompBounceVelocity: 250,
            contactDamage: 1000,
        },
        ai: {
            type: 'defensive_cycle',
            spikesInDuration: 2.0,
            spikesOutDuration: 3.0,
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
            stompBounceVelocity: 300,
            contactDamage: 1000,
        },
        ai: {
            type: 'flying_patrol',
            patrolDistance: 200,
            horizontalSpeed: 60,
            verticalAmplitude: 10,
            verticalFrequency: 2,
        }
    },

    fatbird: {
        width: 40,
        height: 48,
        spriteKey: 'fatbird',
        animations: {
            idle: { frameCount: 8, speed: 0.08 },
            fall: { frameCount: 4, speed: 0.1 },
            ground: { frameCount: 4, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 },
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 300,
            dealsContactDamage: false,
            contactDamage: 1000,
        },
        ai: {
            type: 'flying_slam',
        }
    },
};