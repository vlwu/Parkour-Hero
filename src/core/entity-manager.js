export class EntityManager {
    constructor() {
        this.nextEntityId = 0;
        this.freeEntities = [];
        this.activeEntities = []; 
        
        this.componentsByClass = new Map();
        
        this.nextBit = 1;
        this.componentBits = new Map();
        
        this.entityMasks = []; 
        this.queryCache = new Map(); 
    }

    createEntity() {
        const entityId = this.freeEntities.length > 0 ? this.freeEntities.pop() : this.nextEntityId++;
        this.entityMasks[entityId] = 0;
        this.activeEntities.push(entityId);
        return entityId;
    }

    _getComponentBit(componentClass) {
        if (!this.componentBits.has(componentClass)) {
            this.componentBits.set(componentClass, this.nextBit);
            this.nextBit <<= 1;
        }
        return this.componentBits.get(componentClass);
    }

    addComponent(entityId, component) {
        const componentClass = component.constructor;
        if (!this.componentsByClass.has(componentClass)) {
            this.componentsByClass.set(componentClass, new Map());
        }
        this.componentsByClass.get(componentClass).set(entityId, component);
        
        this.entityMasks[entityId] |= this._getComponentBit(componentClass);
        return this;
    }

    getComponent(entityId, componentClass) {
        const componentMap = this.componentsByClass.get(componentClass);
        return componentMap ? componentMap.get(entityId) : undefined;
    }

    hasComponent(entityId, componentClass) {
        const bit = this.componentBits.get(componentClass);
        if (!bit) return false;
        return (this.entityMasks[entityId] & bit) === bit;
    }

    removeComponent(entityId, componentClass) {
        const componentMap = this.componentsByClass.get(componentClass);
        if (componentMap) {
            componentMap.delete(entityId);
        }
        const bit = this.componentBits.get(componentClass);
        if (bit) {
            this.entityMasks[entityId] &= ~bit;
        }
    }

    destroyEntity(entityId) {
        const idx = this.activeEntities.indexOf(entityId);
        if (idx !== -1) {
            this.activeEntities.splice(idx, 1);
        }
        for (const componentMap of this.componentsByClass.values()) {
            componentMap.delete(entityId);
        }
        this.entityMasks[entityId] = 0;
        this.freeEntities.push(entityId);
    }

    query(componentClasses) {
        let requiredMask = 0;
        for (let i = 0; i < componentClasses.length; i++) {
            requiredMask |= this._getComponentBit(componentClasses[i]);
        }

        const result = [];
        for (let i = 0; i < this.activeEntities.length; i++) {
            const id = this.activeEntities[i];
            if ((this.entityMasks[id] & requiredMask) === requiredMask) {
                result.push(id);
            }
        }
        return result;
    }
}