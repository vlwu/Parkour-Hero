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
            walk: { frameCount: 10, speed: 0.15 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 250,
        },
        ai: {
            type: 'patrol',
            aggroRange: 0,
            patrolSpeed: 20,
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
        },
        ai: {
            type: 'patrol',
            patrolSpeed: 25,
            particleDropInterval: 0.8,
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
        },
        ai: {
            type: 'defensive_cycle',
            spikesInDuration: 2.0,
            spikesOutDuration: 3.0,
        }
    },
};