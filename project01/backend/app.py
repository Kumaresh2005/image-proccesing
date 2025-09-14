
from flask import Flask, request, send_file
from flask_cors import CORS
from PIL import Image
import io
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

app = Flask(__name__)
CORS(app)


@app.route('/process', methods=['POST'])
def process_image():
    import sys
    print('--- /process called ---', file=sys.stderr)
    print('Form:', request.form, file=sys.stderr)
    print('Files:', request.files, file=sys.stderr)
    if 'image' not in request.files:
        print('No image uploaded', file=sys.stderr)
        return 'No image uploaded', 400
    file = request.files['image']
    mode = request.form.get('mode', 'grayscale')
    print('Mode:', mode, file=sys.stderr)
    img = Image.open(file.stream)
    # Resize if requested
    resize_width = request.form.get('resize_width')
    resize_height = request.form.get('resize_height')
    dpi = request.form.get('dpi')
    if resize_width and resize_height:
        try:
            img = img.resize((int(resize_width), int(resize_height)), Image.LANCZOS)
        except Exception as e:
            print('Resize error:', e, file=sys.stderr)
    buf = io.BytesIO()
    if mode == 'colorize':
        if cv2 is None:
            print('OpenCV not installed', file=sys.stderr)
            return 'OpenCV not installed on server', 500
        img = img.convert('L')
        np_img = np.array(img)
        np_img = cv2.cvtColor(np_img, cv2.COLOR_GRAY2BGR)
        color_img = Image.fromarray(np_img)
        if dpi:
            color_img.save(buf, format='PNG', dpi=(int(dpi), int(dpi)))
        else:
            color_img.save(buf, format='PNG')
    elif mode == 'grayscale':
        img = img.convert('L')
        if dpi:
            img.save(buf, format='PNG', dpi=(int(dpi), int(dpi)))
        else:
            img.save(buf, format='PNG')
    else:
        print('Unknown mode:', mode, file=sys.stderr)
        return 'Unknown mode', 400
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
