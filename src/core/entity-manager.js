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
        
        this._updateQueryCache(entityId, 0, 0, false, true);
        return entityId;
    }

    _getComponentBit(componentClass) {
        if (!this.componentBits.has(componentClass)) {
            this.componentBits.set(componentClass, this.nextBit);
            this.nextBit <<= 1;
        }
        return this.componentBits.get(componentClass);
    }

    _updateQueryCache(entityId, oldMask, newMask, isDestroyed = false, isCreated = false) {
        for (const [requiredMask, cacheEntry] of this.queryCache.entries()) {
            const matchedOld = !isCreated && ((oldMask & requiredMask) === requiredMask);
            const matchedNew = !isDestroyed && ((newMask & requiredMask) === requiredMask);

            if (matchedOld && !matchedNew) {
                cacheEntry.set.delete(entityId);
                cacheEntry.dirty = true;
            } else if (!matchedOld && matchedNew) {
                cacheEntry.set.add(entityId);
                cacheEntry.dirty = true;
            }
        }
    }

    addComponent(entityId, component) {
        const componentClass = component.constructor;
        if (!this.componentsByClass.has(componentClass)) {
            this.componentsByClass.set(componentClass, new Map());
        }
        this.componentsByClass.get(componentClass).set(entityId, component);
        
        const oldMask = this.entityMasks[entityId] || 0;
        const newMask = oldMask | this._getComponentBit(componentClass);
        this.entityMasks[entityId] = newMask;
        
        this._updateQueryCache(entityId, oldMask, newMask);
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
            const oldMask = this.entityMasks[entityId] || 0;
            const newMask = oldMask & ~bit;
            this.entityMasks[entityId] = newMask;
            
            this._updateQueryCache(entityId, oldMask, newMask);
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
        
        const oldMask = this.entityMasks[entityId] || 0;
        this.entityMasks[entityId] = 0;
        
        this._updateQueryCache(entityId, oldMask, 0, true);
        
        this.freeEntities.push(entityId);
    }

    query(componentClasses) {
        let requiredMask = 0;
        for (let i = 0; i < componentClasses.length; i++) {
            requiredMask |= this._getComponentBit(componentClasses[i]);
        }

        let cacheEntry = this.queryCache.get(requiredMask);
        
        if (!cacheEntry) {
            const entitySet = new Set();
            for (let i = 0; i < this.activeEntities.length; i++) {
                const id = this.activeEntities[i];
                if ((this.entityMasks[id] & requiredMask) === requiredMask) {
                    entitySet.add(id);
                }
            }
            cacheEntry = {
                set: entitySet,
                array: Array.from(entitySet),
                dirty: false
            };
            this.queryCache.set(requiredMask, cacheEntry);
        } else if (cacheEntry.dirty) {
            cacheEntry.array = Array.from(cacheEntry.set);
            cacheEntry.dirty = false;
        }
        
        return cacheEntry.array;
    }
}