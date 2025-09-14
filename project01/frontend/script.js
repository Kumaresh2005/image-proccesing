const dropArea = document.getElementById('dropArea');
const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const processBtn = document.getElementById('processBtn');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const resultImg = document.getElementById('result');
const dropText = document.getElementById('dropText');
const downloadBtn = document.getElementById('downloadBtn');
const resizeWidth = document.getElementById('resizeWidth');
const resizeHeight = document.getElementById('resizeHeight');
const resizeDpi = document.getElementById('resizeDpi');
const autoFillBtn = document.getElementById('autoFillBtn');

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
        preview.src = evt.target.result;
        preview.style.display = 'block';
        processBtn.style.display = 'block';
        resultImg.style.display = 'none';
        progress.style.display = 'none';
        progressLabel.textContent = '';
        // Auto-fill width/height fields
        const imgEl = new window.Image();
        imgEl.onload = function() {
            resizeWidth.value = imgEl.naturalWidth;
            resizeHeight.value = imgEl.naturalHeight;
        };
        imgEl.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

autoFillBtn.addEventListener('click', function() {
    if (preview.src && preview.style.display !== 'none') {
        const imgEl = new window.Image();
        imgEl.onload = function() {
            resizeWidth.value = imgEl.naturalWidth;
            resizeHeight.value = imgEl.naturalHeight;
        };
        imgEl.src = preview.src;
    }
});

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) showPreview(file);
});

dropArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropArea.classList.add('dragover');
});
dropArea.addEventListener('dragleave', function(e) {
    dropArea.classList.remove('dragover');
});
dropArea.addEventListener('drop', function(e) {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        imageInput.files = e.dataTransfer.files;
        showPreview(file);
    }
});

processBtn.addEventListener('click', function() {
    const file = imageInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    // Get selected mode
    const mode = document.querySelector('input[name="mode"]:checked').value;
    formData.append('mode', mode);
    // Add resize and dpi fields
    const width = resizeWidth.value;
    const height = resizeHeight.value;
    const dpi = resizeDpi.value;
    if (width) formData.append('resize_width', width);
    if (height) formData.append('resize_height', height);
    if (dpi) formData.append('dpi', dpi);
    progress.style.display = 'block';
    progressBar.style.width = '0%';
    progressLabel.textContent = 'Uploading...';
    fetch('http://localhost:5000/process', {
        method: 'POST',
        body: formData
    }).then(response => {
        if (!response.ok) throw new Error('Processing failed');
        progressBar.style.width = '60%';
        progressLabel.textContent = 'Processing...';
        return response.blob();
    }).then(blob => {
        const url = URL.createObjectURL(blob);
        resultImg.src = url;
        resultImg.style.display = 'block';
        progressBar.style.width = '100%';
        progressLabel.textContent = 'Done!';
        // Show and set download button
        downloadBtn.href = url;
        downloadBtn.style.display = 'block';
    }).catch(err => {
        progress.style.display = 'none';
        progressLabel.textContent = '';
        alert('Error processing image: ' + err);
        downloadBtn.style.display = 'none';
    });
});
