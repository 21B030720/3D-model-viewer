class TransformComponent extends Component {
    constructor(position = new THREE.Vector3(), rotation = new THREE.Euler(), scale = new THREE.Vector3(1, 1, 1)) {
        super();
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }
}

class ModelComponent extends Component {
    constructor(model) {
        super();
        this.model = model;
        this.originalMaterials = new Map();
    }
}

class AnimationComponent extends Component {
    constructor(mixer, animations = []) {
        super();
        this.mixer = mixer;
        this.animations = animations;
        this.currentAnimation = null;
        this.isLooping = false;
    }
}

class DisappearComponent extends Component {
    constructor() {
        super();
        this.duration = 3000;
        this.progress = 0;
        this.active = false;
        this.originalOpacities = new Map();
    }
}

class ColorComponent extends Component {
    constructor() {
        super();
        this.originalColors = new Map();
        this.currentColor = null;
    }
} 