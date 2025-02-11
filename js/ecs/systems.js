class AnimationSystem extends System {
    update(deltaTime) {
        for (const entity of this.world.entities.values()) {
            if (entity.hasComponent(AnimationComponent)) {
                const anim = entity.getComponent(AnimationComponent);
                if (anim.mixer) {
                    anim.mixer.update(deltaTime);
                }
            }
        }
    }
}

class DisappearSystem extends System {
    update(deltaTime) {
        for (const entity of this.world.entities.values()) {
            if (entity.hasComponent(DisappearComponent) && entity.hasComponent(ModelComponent)) {
                const disappear = entity.getComponent(DisappearComponent);
                const model = entity.getComponent(ModelComponent).model;

                if (disappear.active) {
                    model.traverse(child => {
                        if (child.isMesh) {
                            if (!child.material.transparent) {
                                child.material = child.material.clone();
                                child.material.transparent = true;
                                disappear.originalOpacities.set(child.id, child.material.opacity || 1);
                            }
                            const originalOpacity = disappear.originalOpacities.get(child.id);
                            child.material.opacity = originalOpacity * (1 - disappear.progress);
                        }
                    });

                    disappear.progress += deltaTime / (disappear.duration / 1000);
                    if (disappear.progress >= 1) {
                        disappear.active = false;
                        disappear.progress = 0;
                    }
                }
            }
        }
    }
}

class ColorSystem extends System {
    update() {
        for (const entity of this.world.entities.values()) {
            if (entity.hasComponent(ColorComponent) && entity.hasComponent(ModelComponent)) {
                const color = entity.getComponent(ColorComponent);
                const model = entity.getComponent(ModelComponent).model;

                if (color.currentColor) {
                    model.traverse(child => {
                        if (child.isMesh) {
                            if (!color.originalColors.has(child.id)) {
                                color.originalColors.set(child.id, child.material.color.clone());
                            }
                            child.material.color.copy(color.currentColor);
                        }
                    });
                    color.currentColor = null;
                }
            }
        }
    }
} 