document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('scene-container');
    const menuContainer = document.getElementById('menu-container');
    const modelViewer = new ModelViewer(container);
    // Make modelViewer accessible globally
    window.modelViewer = modelViewer;
    let menuSystem = null;

    //
    // Model viewer
    //
    // File upload handling
    const fileInput = document.getElementById('modelUpload');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file);
            if (file.name.toLowerCase().endsWith('.glb')) {
                modelViewer.loadModel(file);
            } else {
                console.error('Please select a GLB file');
                alert('Please select a GLB file');
            }
        }
    });

    // Animation controlling
    const animationControls = document.getElementById('animationControls');
    const animationsList = document.getElementById('animationsList');
    const loopToggle = document.getElementById('loopToggle');

    modelViewer.addEventListener('animationsLoaded', (e) => {
        const animations = e.detail.animations;
        animationsList.innerHTML = '';
        animations.forEach((anim, index) => {
            const li = document.createElement('li');
            li.textContent = anim.name || `Animation ${index + 1}`;
            li.addEventListener('click', () => {
                modelViewer.playAnimation(index, loopToggle.checked);
                document.querySelectorAll('#animationsList li').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
            });
            animationsList.appendChild(li);
        });
        animationControls.classList.remove('hidden');
    });

    // Recoloring effect
    document.getElementById('recolorBtn').addEventListener('click', () => {
        modelViewer.recolorModel();
    });

    // Disappearing effect
    document.getElementById('disappearBtn').addEventListener('click', () => {
        modelViewer.disappearEffect();
    });

    // 
    // Menu system
    //
    // Open menu
    document.getElementById('menuBtn').addEventListener('click', () => {
        if (container.classList.contains('hidden')) {
            // Switching to model viewer
            container.classList.remove('hidden');
            menuContainer.classList.add('hidden');
        } else {
            // Switching to menu
            container.classList.add('hidden');
            menuContainer.classList.remove('hidden');
            if (!menuSystem) {
                menuSystem = new MenuSystem(menuContainer);
            }
        }
    });

    // Export menu
    document.getElementById('exportMenuBtn').addEventListener('click', () => {
        if (menuSystem) {
            menuSystem.exportMenu();
        }
    });
}); 