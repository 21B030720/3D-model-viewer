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
        this.loader = new THREE.GLTFLoader();
        
        this.init();
        this.loadMenuData().then(() => {
            this.handleUrlPath();
        }).catch(error => {
            console.error('Error loading menu:', error);
        });
        
        // Listen for URL changes and browser back/forward
        window.addEventListener('popstate', (event) => {
            if (this.menuData) {
                // Get current URL path
                const params = new URLSearchParams(window.location.search);
                const pathString = params.get('path');
                
                // Reset path and navigate
                this.currentPath = pathString ? pathString.split('/') : [];
                this.displayCurrentLevel();
            }
        });
    }

    async loadMenuData() {
        try {
            console.log('Loading menu data...');
            const response = await fetch('data/menu.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.menuData = await response.json();
            console.log('Menu data loaded:', this.menuData);
            
            // Verify model paths
            const verifyModelPaths = (items) => {
                items.forEach(item => {
                    if (item.model) {
                        console.log('Found model path:', item.model);
                        // Optionally verify file exists
                        fetch(item.model)
                            .then(response => {
                                if (!response.ok) {
                                    console.warn(`Model file not found: ${item.model}`);
                                }
                            })
                            .catch(error => {
                                console.warn(`Error checking model file ${item.model}:`, error);
                            });
                    }
                    if (item.options) {
                        verifyModelPaths(item.options);
                    }
                });
            };
            
            verifyModelPaths(this.menuData.menu_options);
            this.displayCurrentLevel();
        } catch (error) {
            console.error('Error loading menu data:', error);
            throw error;
        }
    }

    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);  // Slightly lighter background

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 15);  // Move camera back and up
        this.camera.lookAt(0, 0, 0);

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);  // Increased intensity
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);  // Increased intensity
        directionalLight.position.set(5, 5, 5);  // Adjusted position
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-5, -5, -5);
        
        this.scene.add(ambientLight, directionalLight, directionalLight2);

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
            if (this.scene.children[0].type === 'Light') {
                break;  // Keep lights
            }
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
        const spacing = 5;  // Increased spacing for models
        const rows = Math.ceil(Math.sqrt(items.length));
        const cols = Math.ceil(items.length / rows);

        items.forEach((item, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = (col - (cols - 1) / 2) * spacing;
            const y = (row - (rows - 1) / 2) * spacing;

            // Create container box
            const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
            const boxMaterial = new THREE.MeshPhongMaterial({ 
                color: item.color,
                transparent: true,
                opacity: 0.2,
                shininess: 100,
                side: THREE.DoubleSide
            });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.set(x, y, 0);
            box.userData.item = item;
            
            // Add delete button
            const deleteButtonGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const deleteButtonMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xff0000,  // Bright red
                emissive: 0x660000,  // Dark red glow
                shininess: 30
            });
            const deleteButton = new THREE.Mesh(deleteButtonGeometry, deleteButtonMaterial);
            deleteButton.position.set(1.5, 1.5, 1.5); // Top right corner
            deleteButton.userData.isDeleteButton = true;
            box.add(deleteButton);

            // Add copy link button
            const copyButtonGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const copyButtonMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x00ff00,  // Bright green
                emissive: 0x006600,  // Dark green glow
                shininess: 30
            });
            const copyButton = new THREE.Mesh(copyButtonGeometry, copyButtonMaterial);
            copyButton.position.set(-1.5, 1.5, 1.5); // Top left corner
            copyButton.userData.isCopyButton = true;
            box.add(copyButton);
            
            // Add wireframe
            const wireframe = new THREE.LineSegments(
                new THREE.EdgesGeometry(boxGeometry),
                new THREE.LineBasicMaterial({ 
                    color: item.color,
                    linewidth: 2,
                    opacity: 0.8,
                    transparent: true
                })
            );
            box.add(wireframe);
            
            this.scene.add(box);

            if (item.model) {
                // Load 3D model if specified
                this.loader.load(item.model, (gltf) => {
                    const model = gltf.scene;
                    
                    // Scale and center model
                    const bbox = new THREE.Box3().setFromObject(model);
                    const size = bbox.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2 / maxDim;  // Fit inside box
                    model.scale.setScalar(scale);

                    // Center model in box
                    bbox.setFromObject(model);
                    const center = bbox.getCenter(new THREE.Vector3());
                    model.position.sub(center.multiplyScalar(scale));
                    
                    // Position model in scene
                    model.position.add(box.position);
                    
                    // Add to scene
                    this.scene.add(model);
                    
                    // Optional: animate model rotation
                    model.userData.animate = true;
                    model.userData.rotationSpeed = 0.01;
                }, undefined, (error) => {
                    console.error('Error loading model:', error);
                    // Add text as fallback if model fails to load
                    createTextLabel(item.name, box);
                });
            } else {
                // Create text label if no model
                createTextLabel(item.name, box);
            }
        });

        this.updatePathDisplay();
    }

    onMouseClick(event) {
        event.preventDefault();
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const clicked = intersects[0].object;
            
            // Get the parent box that contains the item data
            let itemBox = clicked;
            while (itemBox && !itemBox.userData.item) {
                itemBox = itemBox.parent;
            }

            if (!itemBox || !itemBox.userData.item) return;
            const item = itemBox.userData.item;

            // Handle special buttons first
            if (clicked.userData.isDeleteButton) {
                this.deleteMenuItem(item);
                return;
            }

            if (clicked.userData.isCopyButton) {
                this.copyItemLink(item);
                return;
            }

            // Handle navigation and model viewing
            if (item.level === 2 && item.model) {
                // Switch to model viewer
                const modelViewer = document.getElementById('scene-container');
                const menuContainer = document.getElementById('menu-container');
                
                modelViewer.classList.remove('hidden');
                menuContainer.classList.add('hidden');
                
                // Load the model
                const modelViewerInstance = window.modelViewer;
                if (modelViewerInstance) {
                    fetch(item.model)
                        .then(response => response.blob())
                        .then(blob => {
                            const file = new File([blob], 'model.glb');
                            modelViewerInstance.loadModel(file);
                        })
                        .catch(error => {
                            console.error('Error loading model:', error);
                        });
                }
            } else if (item.options) {
                // Navigate to subcategory
                this.currentPath.push(item.name);
                this.displayCurrentLevel();
            }

            // Update URL when navigating
            if (item.options || (item.level === 2 && item.model)) {
                const path = [...this.currentPath];
                if (item.options) {
                    path.push(item.name);
                }
                const url = new URL(window.location.href);
                url.searchParams.set('path', path.join('/'));
                window.history.pushState({}, '', url.toString());
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
            if (child.material && child.material.transparent) {
                child.material.opacity = 0.1;  // Default very transparent
                child.children.forEach(wireframe => {
                    if (wireframe.material) {
                        wireframe.material.opacity = 1;  // Wireframe stays visible
                    }
                });
                child.scale.set(1, 1, 1);
            }
        });

        if (intersects.length > 0) {
            const selected = intersects[0].object;
            if (selected.material && selected.material.transparent) {
                selected.material.opacity = 0.4;  // Slightly more visible on hover
                selected.children.forEach(wireframe => {
                    if (wireframe.material) {
                        wireframe.material.opacity = 1;  // Full opacity for wireframe on hover
                    }
                });
                selected.scale.set(1.1, 1.1, 1.1);
            }
        }
    }

    goBack() {
        if (this.currentPath.length > 0) {
            this.currentPath.pop();
            
            // Update URL to reflect new path
            const url = new URL(window.location.href);
            if (this.currentPath.length > 0) {
                url.searchParams.set('path', this.currentPath.join('/'));
            } else {
                url.searchParams.delete('path'); // Remove path parameter if we're at root
            }
            window.history.pushState({}, '', url.toString());
            
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
        
        // Rotate models
        this.scene.traverse((object) => {
            if (object.userData.animate) {
                object.rotation.y += object.userData.rotationSpeed;
            }
        });

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

    deleteMenuItem(item) {
        // Find and remove item from menu data
        let currentLevel = this.menuData.menu_options;
        for (let i = 0; i < this.currentPath.length; i++) {
            const found = currentLevel.find(opt => opt.name === this.currentPath[i]);
            if (found) currentLevel = found.options;
        }
        
        const index = currentLevel.findIndex(opt => opt.name === item.name);
        if (index !== -1) {
            currentLevel.splice(index, 1);
            
            // Animate deletion
            anime({
                targets: this.scene.children.find(child => child.userData.item === item).position,
                y: [0, 10],
                opacity: [1, 0],
                duration: 1000,
                easing: 'easeOutExpo',
                complete: () => {
                    this.displayCurrentLevel();
                }
            });
        }
    }

    copyItemLink(item) {
        const path = [...this.currentPath, item.name];
        const url = new URL(window.location.href);
        url.searchParams.set('path', path.join('/'));
        
        // Update browser URL without reloading
        window.history.pushState({}, '', url.toString());
        
        navigator.clipboard.writeText(url.toString())
            .then(() => {
                // Show success feedback
                const feedback = document.createElement('div');
                feedback.textContent = 'Link copied!';
                feedback.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #4CAF50;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 4px;
                    z-index: 1000;
                `;
                document.body.appendChild(feedback);
                setTimeout(() => feedback.remove(), 2000);
            });
    }

    // Add gallery navigation
    addGalleryNavigation() {
        const prevButton = document.createElement('button');
        prevButton.textContent = '←';
        prevButton.className = 'gallery-nav prev';
        prevButton.addEventListener('click', () => this.navigateGallery(-1));

        const nextButton = document.createElement('button');
        nextButton.textContent = '→';
        nextButton.className = 'gallery-nav next';
        nextButton.addEventListener('click', () => this.navigateGallery(1));

        this.container.appendChild(prevButton);
        this.container.appendChild(nextButton);
    }

    navigateGallery(direction) {
        let currentLevel = this.menuData.menu_options;
        for (const path of this.currentPath) {
            const found = currentLevel.find(opt => opt.name === path);
            if (found) currentLevel = found.options;
        }

        const currentIndex = this.currentItemIndex || 0;
        this.currentItemIndex = (currentIndex + direction + currentLevel.length) % currentLevel.length;

        // Animate camera to new position
        const targetPosition = this.getItemPosition(this.currentItemIndex, currentLevel.length);
        anime({
            targets: this.camera.position,
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z + 5,
            duration: 1000,
            easing: 'easeInOutQuad'
        });
    }

    async handleUrlPath() {
        if (!this.menuData) {
            console.warn('Menu data not loaded yet');
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const pathString = params.get('path');
        
        if (pathString) {
            const pathArray = pathString.split('/');
            await this.navigateToPath(pathArray);
        }
    }

    async navigateToPath(pathArray) {
        // Reset to root
        this.currentPath = [];
        let currentLevel = this.menuData.menu_options;
        
        // Try to follow the path
        for (const segment of pathArray) {
            const found = currentLevel.find(item => item.name === segment);
            if (found) {
                this.currentPath.push(segment);
                if (found.options) {
                    currentLevel = found.options;
                } else if (found.model) {
                    // If it's a model, load it
                    await this.loadModelFromItem(found);
                    break;
                }
            } else {
                console.warn(`Path segment "${segment}" not found`);
                break;
            }
        }
        
        this.displayCurrentLevel();
    }

    async loadModelFromItem(item) {
        if (!item.model) return;
        
        // Switch to model viewer
        const modelViewer = document.getElementById('scene-container');
        const menuContainer = document.getElementById('menu-container');
        
        modelViewer.classList.remove('hidden');
        menuContainer.classList.add('hidden');
        
        // Load the model
        const modelViewerInstance = window.modelViewer;
        if (modelViewerInstance) {
            try {
                const response = await fetch(item.model);
                const blob = await response.blob();
                const file = new File([blob], 'model.glb');
                modelViewerInstance.loadModel(file);
            } catch (error) {
                console.error('Error loading model:', error);
            }
        }
    }
}

function createTextLabel(text, box) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    // Set text style
    context.fillStyle = '#ffffff';
    context.font = 'bold 60px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text
    context.fillText(text, canvas.width/2, canvas.height/2);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create material with the text texture
    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    // Create plane for the text
    const textGeometry = new THREE.PlaneGeometry(2.8, 2.8);  // Slightly smaller than box
    
    // Front face
    const frontText = new THREE.Mesh(textGeometry, textMaterial);
    frontText.position.set(0, 0, 1.51);  // Position relative to box center
    box.add(frontText);
    
    // Back face
    const backText = new THREE.Mesh(textGeometry, textMaterial);
    backText.position.set(0, 0, -1.51);
    backText.rotation.y = Math.PI;
    box.add(backText);
    
    // Right face
    const rightText = new THREE.Mesh(textGeometry, textMaterial);
    rightText.position.set(1.51, 0, 0);
    rightText.rotation.y = Math.PI / 2;
    box.add(rightText);
    
    // Left face
    const leftText = new THREE.Mesh(textGeometry, textMaterial);
    leftText.position.set(-1.51, 0, 0);
    leftText.rotation.y = -Math.PI / 2;
    box.add(leftText);
}