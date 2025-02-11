class ModelViewer extends EventTarget {
    constructor(container) {
        super();
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.currentModel = null;
        this.mixer = null;
        this.animations = [];
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 5;

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(ambientLight, directionalLight);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    loadModel(file) {
        const loader = new THREE.GLTFLoader();
        const reader = new FileReader();

        reader.onload = (e) => {
            const buffer = e.target.result;
            loader.parse(buffer, '', (gltf) => {
                if (this.currentModel) {
                    this.scene.remove(this.currentModel);
                }

                this.currentModel = gltf.scene;
                this.scene.add(this.currentModel);

                // Center and scale model
                const box = new THREE.Box3().setFromObject(this.currentModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                this.currentModel.scale.setScalar(scale);
                this.currentModel.position.sub(center.multiplyScalar(scale));

                // Setup animations
                if (gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.currentModel);
                    this.animations = gltf.animations;
                    this.dispatchEvent(new CustomEvent('animationsLoaded', { 
                        detail: { animations: this.animations }
                    }));
                }
            });
        };

        reader.readAsArrayBuffer(file);
    }

    playAnimation(index, loop = true) {
        if (!this.mixer || !this.animations[index]) return;
        
        this.mixer.stopAllAction();
        const action = this.mixer.clipAction(this.animations[index]);
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        action.reset().play();
    }

    recolorModel() {
        if (!this.currentModel) return;
        
        const newColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        this.currentModel.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.color = newColor;
            }
        });
    }

    disappearEffect() {
        if (!this.currentModel) return;

        const meshes = [];
        this.currentModel.traverse((child) => {
            if (child.isMesh) {
                meshes.push(child);
                child.userData.originalOpacity = child.material.opacity || 1;
            }
        });

        anime({
            targets: meshes.map(mesh => ({
                opacity: 0,
                mesh: mesh
            })),
            opacity: 0,
            duration: 2000,
            delay: anime.stagger(100),
            easing: 'easeInOutQuad',
            update: (anim) => {
                meshes.forEach((mesh, index) => {
                    if (!mesh.material.transparent) {
                        mesh.material = mesh.material.clone();
                        mesh.material.transparent = true;
                    }
                    mesh.material.opacity = anim.animations[index].currentValue;
                });
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.mixer) {
            this.mixer.update(0.016);
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
} 