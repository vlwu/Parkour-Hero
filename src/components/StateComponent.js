export class StateComponent {
    /**
     * Tracks the current behavioral state of an entity. This is the core
     * of the Finite State Machine (FSM), extracted into a data component.
     * @param {string} [initialState='idle'] The state the entity should start in.
     */
    constructor(initialState = 'idle') {
        this.currentState = initialState;
    }
}