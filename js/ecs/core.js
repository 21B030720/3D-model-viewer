// Core ECS classes
class Component {
    constructor() {
        if (new.target === Component) {
            throw new Error("Cannot instantiate Component directly");
        }
    }
}

class Entity {
    constructor() {
        this.id = crypto.randomUUID();
        this.components = new Map();
    }

    addComponent(component) {
        if (!(component instanceof Component)) {
            throw new Error("Can only add Component instances");
        }
        this.components.set(component.constructor.name, component);
        return this;
    }

    getComponent(componentClass) {
        return this.components.get(componentClass.name);
    }

    hasComponent(componentClass) {
        return this.components.has(componentClass.name);
    }

    removeComponent(componentClass) {
        this.components.delete(componentClass.name);
    }
}

class System {
    constructor() {
        if (new.target === System) {
            throw new Error("Cannot instantiate System directly");
        }
        this.world = null;
    }

    update(deltaTime) {
        throw new Error("System must implement update method");
    }
}

class World {
    constructor() {
        this.entities = new Map();
        this.systems = new Set();
        this.lastTime = performance.now();
    }

    createEntity() {
        const entity = new Entity();
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(entityId) {
        this.entities.delete(entityId);
    }

    addSystem(system) {
        if (!(system instanceof System)) {
            throw new Error("Can only add System instances");
        }
        this.systems.add(system);
        system.world = this;
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        for (const system of this.systems) {
            system.update(deltaTime);
        }
    }
} 