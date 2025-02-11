document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('scene-container');
    const modelViewer = new ModelViewer(container);
    
    // File upload handling
    const fileInput = document.getElementById('modelUpload');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            modelViewer.loadModel(file);
        }
    });

    // Animation controls
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

    // Effect buttons
    document.getElementById('recolorBtn').addEventListener('click', () => {
        modelViewer.recolorModel();
    });

    document.getElementById('disappearBtn').addEventListener('click', () => {
        modelViewer.disappearEffect();
    });
}); 