# 🛡️✨ **Advanced Biometric Authentication & Cybersecurity Simulator** ✨🛡️

<p align="center">
  <img src="https://img.shields.io/badge/Cybersecurity-Interactive-blueviolet?style=for-the-badge&logo=security&logoColor=white" />
  <img src="https://img.shields.io/badge/Modern%20UI-Glassmorphism-764ba2?style=for-the-badge" />
  <img src="https://img.shields.io/badge/100%25%20Frontend-JavaScript%20%7C%20HTML%20%7C%20CSS-667eea?style=for-the-badge" />
</p>

---

<div align="center">
  <img src="https://img.icons8.com/fluency/96/000000/fingerprint-scan.png" width="80"/>
  <img src="https://img.icons8.com/fluency/96/000000/face-id.png" width="80"/>
  <img src="https://img.icons8.com/fluency/96/000000/voice-recognition-scan.png" width="80"/>
</div>

<h2 align="center">🚀 Experience Cybersecurity Like Never Before!</h2>

---

## ✨ **Features at a Glance**

| 🧩 | **Security Features Panel** — Toggle liveness, rate limiting, awareness, and anti-replay ON/OFF |
|----|-------------------------------------------------------------------------------------------------|
| 👁️ | **Facial Recognition** — Simulate face authentication with liveness detection                   |
| 🎤 | **Voice Recognition** — Voice-based authentication with real-time visualizer                    |
| 👆 | **Fingerprint Scanner** — Touch-based biometric simulation                                      |
| 🔒 | **Multi-Factor Authentication** — Combine biometrics for extra security                        |
| ⚔️ | **Attack Simulation Lab** — Launch spoofing, brute force, social engineering, and replay attacks|
| 🛡️ | **Cybersecurity Analysis** — Penetration testing, threat detection, network monitoring, encryption|
| 📊 | **Dynamic Security Dashboard** — Live metrics, threat level, vulnerabilities, and animated updates|
| 💡 | **Info Popups & Tooltips** — Learn how attacks work and how to defend, with beautiful modals     |
| 🎨 | **Modern UI** — Glassmorphism, animated toggles, and responsive design                          |

---

## 🚀 NEW: Real Face & Voice Recognition (with Backend)

### ✨ Features
- **Facial Recognition**: Register and recognize faces using your webcam, powered by OpenCV and Flask.
- **Voice (Speaker) Recognition**: Register and recognize your voice (who you are, not just what you say) using your microphone, powered by resemblyzer and Flask.
- **Live Biometric Authentication**: All processing is done in real time with a modern web UI.

---

## 🛠️ Setup & Installation

### 1. Clone the Repository
```sh
git clone <repo-url>
cd <repo-folder>
```

### 2. Install Python Dependencies
Make sure you have Python 3.8+ installed.

```sh
pip install flask flask_cors numpy opencv-python pillow resemblyzer soundfile pydub
```

### 3. Install ffmpeg (Required for Voice Recognition)
- Download ffmpeg for Windows: [ffmpeg.org/download.html](https://ffmpeg.org/download.html)
- Extract the zip, copy the `bin` folder path (e.g., `C:\ffmpeg\bin`)
- Add it to your Windows PATH:
  - Open "Edit the system environment variables" → Environment Variables → System variables → Path → Edit → New → Paste the path → OK
- Restart your terminal and test:
```sh
ffmpeg -version
```
You should see version info, not an error.

### 4. Run the Backend
```sh
python backend.py
```
The backend will start at `http://127.0.0.1:5000`

### 5. Open the Frontend
Just open `index.html` in your browser (Chrome recommended).

---

## 🧑‍💻 Usage
- **Allow camera and microphone access** when prompted by your browser.
- Use the UI to register your face and voice, then try authenticating.
- All biometric data is stored locally in the `registered_faces` and `registered_voices` folders.

---

## 🛡️ API Endpoints (Backend)

### Face
- `POST /register_face` — Register a face (JSON: `{name, image}` [base64])
- `POST /recognize_face` — Recognize a face (JSON: `{image}` [base64])

### Voice
- `POST /register_voice` — Register a voice (FormData: `name`, `audio` [webm])
- `POST /recognize_voice` — Recognize a voice (FormData: `audio` [webm])

---

## 🐞 Troubleshooting
- If you see errors about audio format, make sure ffmpeg is installed and in your PATH.
- If the webcam or mic doesn't work, check browser permissions and use `localhost` (not `file://`).
- For best results, use Chrome or Edge.

---

## 🌟 **Why You'll Love This Project**

> 🦾 **Truly Interactive:** Every action changes your security posture and dashboard.
>
> 🧠 **Educational:** Learn about real-world attacks, defenses, and best practices.
>
> 🎉 **Beautifully Animated:** From toggles to popups, enjoy a modern, engaging experience.
>
> 🧪 **Customizable:** Experiment with security features and see the impact instantly.

---

<div align="center">
  <img src="https://img.icons8.com/color/96/000000/hacker.png" width="70"/>
  <img src="https://img.icons8.com/color/96/000000/lock-2.png" width="70"/>
  <img src="https://img.icons8.com/color/96/000000/security-checked.png" width="70"/>
</div>

---

> **Stay safe, stay curious, and keep learning!** 🕶️🔐 