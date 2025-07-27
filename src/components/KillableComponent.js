export class KillableComponent {
    constructor({ stompable = true, stompBounceVelocity = 250, dealsContactDamage = true, contactDamage = 1000 } = {}) {
        this.stompable = stompable;
        this.stompBounceVelocity = stompBounceVelocity;
        this.dealsContactDamage = dealsContactDamage;
        this.contactDamage = contactDamage;
    }
}