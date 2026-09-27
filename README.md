# QuizMaster Arena • Gamified Tech Challenge Platform 🎮🏆

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-black?style=for-the-badge&logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Web Audio](https://img.shields.io/badge/Audio-Synthesizer%20API-a855f7?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A fast-paced, interactive esports-style technical quiz arena with real-time countdown timers, zero-dependency procedural audio synthesizers, 50-50 lifelines, animated celebratory confetti, and a persistent SQLite leaderboard.

Transformed from a basic Python terminal quiz into a competitive, multiplayer-ready web application with category tracks and post-match analytical review.

---

## ✨ Features

- 🎮 **Arcade Arena Game Loop**:
  - Live 15-second per-question circular timer with urgency audio pulses and color transitions.
  - Smooth card animations and keyboard shortcut bindings (`1`, `2`, `3`, `4`).
- 🔊 **Zero-Dependency Procedural Audio**: Uses the browser's native **Web Audio API** oscillator and gain nodes to synthesize rich success chimes and buzzer effects without loading external mp3 assets.
- 💡 **Lifelines & Power-Ups**: Built-in `50:50` lifeline that eliminates two incorrect answers.
- 🎊 **Celebratory Confetti Engine**: Real-time canvas particle burst when scoring 80% or higher.
- 📋 **Post-Match Diagnostic Review**: Deep breakdown of every question with user response, correct answer, and conceptual explanation.
- 🏆 **Global Hall of Fame**: Persistent SQLite-backed leaderboard ranking players by accuracy and elapsed completion time.
- 📚 **Multiple Tech Challenge Tracks**: Pre-loaded with curated questions across **Python Core**, **Web Development**, and **Data Structures & Algorithms**.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/praveenraja143/quiz-master-app.git
cd quiz-master-app

# Install dependencies
pip install -r requirements.txt
```

### 3. Start the Arena Server
```bash
python app.py
```
Open your browser and navigate to:
```
http://localhost:5004
```

---

## 🛠️ Architecture

```
[Challenge Lobby] ──► [GET /api/questions] ──► [Timer & Question Engine]
                                                        │
                                                        ▼
[Post-Match Review] ◄── [POST /api/submit] ◄── [Interactive Choices]
        │
        ▼
[SQLite Hall of Fame] ◄── [GET /api/leaderboard]
```

---

## 🛠️ Tech Stack
- **Backend**: Python 3, Flask, SQLite3
- **Audio**: Web Audio API (Synthesizer Oscillator & Gain Nodes)
- **Visuals**: HTML5 2D Canvas Confetti, Vanilla CSS3 (Custom Cyberpunk Glassmorphism)
- **Icons**: FontAwesome 6 Pro-free

---

## 📄 License
Licensed under the [MIT License](LICENSE).
