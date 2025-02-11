class MenuSystem {
    constructor(container) {
        console.log('MenuSystem initialized with container:', container);
        this.container = container;
        this.menuData = null;
        this.currentPath = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedObjects = [];
        
        this.init();
        this.loadMenuData();
    }

    async loadMenuData() {
        try {
            console.log('Loading menu data...');
            const response = await fetch('data/menu.json');
            this.menuData = await response.json();
            console.log('Menu data loaded:', this.menuData);
            this.displayCurrentLevel();
        } catch (error) {
            console.error('Error loading menu data:', error);
        }
    }

    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.z = 10;

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(ambientLight, directionalLight);

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));

        // Start animation loop
        this.animate();

        // Create back button
        this.createBackButton();
        this.updatePathDisplay();
    }

    createBackButton() {
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.className = 'back-button';
        backButton.addEventListener('click', () => this.goBack());
        this.container.appendChild(backButton);
    }

    updatePathDisplay() {
        let pathDisplay = document.getElementById('path-display');
        if (!pathDisplay) {
            pathDisplay = document.createElement('div');
            pathDisplay.id = 'path-display';
            this.container.appendChild(pathDisplay);
        }
        pathDisplay.textContent = this.currentPath.join(' / ') || 'Categories';
    }

    displayCurrentLevel() {
        console.log('Displaying current level, path:', this.currentPath);
        // Clear existing objects
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }

        let currentMenu = this.menuData.menu_options;
        for (let i = 0; i < this.currentPath.length; i++) {
            const name = this.currentPath[i];
            const found = currentMenu.find(item => item.name === name);
            if (found && found.options) {
                currentMenu = found.options;
            }
        }

        const items = currentMenu;
        const spacing = 3;
        const rows = Math.ceil(Math.sqrt(items.length));
        const cols = Math.ceil(items.length / rows);

        items.forEach((item, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = (col - (cols - 1) / 2) * spacing;
            const y = (row - (rows - 1) / 2) * spacing;

            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshPhongMaterial({ 
                color: item.color,
                transparent: true,
                opacity: 0.8
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, 0);
            mesh.userData.item = item;
            this.scene.add(mesh);
        });

        this.updatePathDisplay();
    }

    onMouseClick(event) {
        event.preventDefault();
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
            const selected = intersects[0].object;
            const item = selected.userData.item;
            
            if (item.options) {
                this.currentPath.push(item.name);
                this.displayCurrentLevel();
            }
        }
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        this.scene.children.forEach(child => {
            if (child.material) {
                child.material.opacity = 0.8;
                child.scale.set(1, 1, 1);
            }
        });

        if (intersects.length > 0) {
            const selected = intersects[0].object;
            selected.material.opacity = 1;
            selected.scale.set(1.1, 1.1, 1.1);
        }
    }

    goBack() {
        if (this.currentPath.length > 0) {
            this.currentPath.pop();
            this.displayCurrentLevel();
        }
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    exportMenu() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.menuData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "menu_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}