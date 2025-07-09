import os
import cv2
import io
import base64
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# Directory to store registered faces
FACES_DIR = "registered_faces"
if not os.path.exists(FACES_DIR):
    os.makedirs(FACES_DIR)

# Path to the trained model
MODEL_PATH = "face_model.yml"

# Load Haar cascade for face detection
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

# Helper: Load all registered faces and labels
def load_faces():
    images, labels, label_names = [], [], []
    for idx, name in enumerate(os.listdir(FACES_DIR)):
        person_dir = os.path.join(FACES_DIR, name)
        if not os.path.isdir(person_dir):
            continue
        for img_name in os.listdir(person_dir):
            img_path = os.path.join(person_dir, img_name)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is not None:
                images.append(img)
                labels.append(idx)
        label_names.append(name)
    return images, np.array(labels), label_names

# Helper: Train recognizer
def train_recognizer():
    images, labels, label_names = load_faces()
    if len(images) == 0:
        return None, []
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(images, labels)
    recognizer.save(MODEL_PATH)
    return recognizer, label_names

# Helper: Load recognizer
def load_recognizer():
    if not os.path.exists(MODEL_PATH):
        return None, []
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_PATH)
    _, _, label_names = load_faces()
    return recognizer, label_names

# Helper: Extract face from image
def extract_face(image):
    faces = face_cascade.detectMultiScale(image, scaleFactor=1.1, minNeighbors=3)
    if len(faces) == 0:
        return None
    x, y, w, h = faces[0]
    return image[y:y+h, x:x+w]

# Helper: Decode base64 image to OpenCV grayscale
def decode_image(data):
    if ',' in data:
        data = data.split(',')[1]
    img_bytes = base64.b64decode(data)
    img = Image.open(io.BytesIO(img_bytes)).convert('L')
    return np.array(img)

@app.route('/register_face', methods=['POST'])
def register_face():
    data = request.json
    name = data.get('name')
    img_b64 = data.get('image')
    if not name or not img_b64:
        return jsonify({'success': False, 'error': 'Missing name or image'}), 400

    img = decode_image(img_b64)
    face = extract_face(img)
    if face is None:
        return jsonify({'success': False, 'error': 'No face detected'}), 400

    # Save face image
    person_dir = os.path.join(FACES_DIR, name)
    os.makedirs(person_dir, exist_ok=True)
    img_count = len(os.listdir(person_dir))
    img_path = os.path.join(person_dir, f'{img_count+1}.png')
    cv2.imwrite(img_path, face)

    # Retrain recognizer
    train_recognizer()

    return jsonify({'success': True, 'message': f'Face registered for {name}.'})

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    data = request.json
    img_b64 = data.get('image')
    if not img_b64:
        return jsonify({'success': False, 'error': 'Missing image'}), 400

    img = decode_image(img_b64)
    face = extract_face(img)
    if face is None:
        return jsonify({'success': False, 'error': 'No face detected'}), 400

    recognizer, label_names = load_recognizer()
    if recognizer is None or not label_names:
        return jsonify({'success': False, 'error': 'No registered faces'}), 400

    label, confidence = recognizer.predict(face)
    # Lower confidence = better match. Adjust threshold as needed.
    if confidence < 70:
        name = label_names[label]
        return jsonify({'success': True, 'name': name, 'confidence': float(confidence)})
    else:
        return jsonify({'success': True, 'name': 'Unknown', 'confidence': float(confidence)})

if __name__ == '__main__':
    app.run(debug=True)