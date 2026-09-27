// Quiz State
let categories = [];
let selectedCategory = "Python";
let questions = [];
let currentQIndex = 0;
let userAnswers = {};
let score = 0;
let timer = null;
let timeLeft = 15;
let totalTimeElapsed = 0;
let timerInterval = null;
let soundEnabled = true;
let audioCtx = null;
let lifelineUsed = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  setupKeyboardControls();
});

function setupKeyboardControls() {
  document.addEventListener("keydown", (e) => {
    if (document.getElementById("quizScreen").classList.contains("hidden")) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 4) {
      selectOption(num - 1);
    }
  });
}

// Audio Synthesizer (Zero mp3 dependency!)
function playTone(freq, type, duration) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function playCorrectSound() {
  playTone(587.33, "sine", 0.1);
  setTimeout(() => playTone(880, "sine", 0.25), 100);
}

function playWrongSound() {
  playTone(220, "sawtooth", 0.25);
}

function toggleAudio() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("soundToggleBtn");
  btn.innerHTML = soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
  showToast(soundEnabled ? "Sound enabled" : "Sound muted", "info");
}

async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    categories = data.categories || [];

    const container = document.getElementById("categoryCards");
    container.innerHTML = categories.map((cat, idx) => `
      <div class="category-card ${cat.name === selectedCategory ? 'selected' : ''}" onclick="selectCategory('${cat.name}', this)">
        <div class="cat-icon-wrap">
          <i class="fa-solid ${getCatIcon(cat.name)}"></i>
        </div>
        <div class="cat-name">${cat.name}</div>
        <div class="cat-meta">${cat.count} Questions</div>
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
  }
}

function getCatIcon(cat) {
  if (cat.includes("Python")) return "fa-brands fa-python";
  if (cat.includes("Web")) return "fa-brands fa-html5";
  if (cat.includes("Data")) return "fa-solid fa-sitemap";
  return "fa-solid fa-code";
}

function selectCategory(cat, element) {
  selectedCategory = cat;
  document.querySelectorAll(".category-card").forEach(c => c.classList.remove("selected"));
  element.classList.add("selected");
}

async function startQuiz() {
  const name = document.getElementById("playerNameInput").value.trim();
  if (!name) return showToast("Please enter your player name.", "error");

  try {
    const res = await fetch(`/api/questions?category=${encodeURIComponent(selectedCategory)}`);
    const data = await res.json();
    questions = data.questions || [];

    if (questions.length === 0) return showToast("No questions available.", "error");

    currentQIndex = 0;
    userAnswers = {};
    score = 0;
    totalTimeElapsed = 0;
    lifelineUsed = false;

    document.getElementById("btnLifeline50").disabled = false;
    document.getElementById("activeTrackBadge").innerText = selectedCategory;
    document.getElementById("liveScore").innerText = "0";

    document.getElementById("lobbyScreen").classList.add("hidden");
    document.getElementById("resultsScreen").classList.add("hidden");
    document.getElementById("quizScreen").classList.remove("hidden");

    renderQuestion();
  } catch (e) {
    showToast("Failed to load questions", "error");
  }
}

function renderQuestion() {
  if (currentQIndex >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[currentQIndex];
  document.getElementById("qProgressText").innerText = `Question ${currentQIndex + 1} / ${questions.length}`;
  document.getElementById("progressTrackFill").style.width = `${((currentQIndex + 1) / questions.length) * 100}%`;
  document.getElementById("questionPrompt").innerText = q.question;

  const grid = document.getElementById("optionsGrid");
  const keys = ["1", "2", "3", "4"];
  grid.innerHTML = q.options.map((opt, idx) => `
    <button class="option-btn" id="opt-btn-${idx}" onclick="selectOption(${idx})">
      <span class="option-key">${keys[idx]}</span>
      <span>${escapeHtml(opt)}</span>
    </button>
  `).join("");

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 15;
  const timerEl = document.getElementById("timerCountdown");
  const timerBox = timerEl.parentElement;
  timerEl.innerText = timeLeft;
  timerBox.classList.remove("warning");

  timerInterval = setInterval(() => {
    timeLeft--;
    totalTimeElapsed++;
    timerEl.innerText = timeLeft;

    if (timeLeft <= 5) {
      timerBox.classList.add("warning");
      playTone(400, "square", 0.05);
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      playWrongSound();
      showToast("Time's up for this question!", "error");
      selectOption(-1); // Skipped/timed out
    }
  }, 1000);
}

function selectOption(index) {
  clearInterval(timerInterval);
  const q = questions[currentQIndex];
  userAnswers[q.id] = index;

  // Visual lock
  document.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true);

  if (index >= 0) {
    const chosenBtn = document.getElementById(`opt-btn-${index}`);
    if (chosenBtn) {
      chosenBtn.classList.add("selected-correct");
      score++;
      document.getElementById("liveScore").innerText = score;
      playCorrectSound();
    }
  }

  setTimeout(() => {
    currentQIndex++;
    renderQuestion();
  }, 650);
}

function useLifeline50() {
  if (lifelineUsed) return;
  lifelineUsed = true;
  document.getElementById("btnLifeline50").disabled = true;

  // Hide 2 options randomly
  const btns = [0, 1, 2, 3];
  const shuffled = btns.sort(() => 0.5 - Math.random());
  shuffled.slice(0, 2).forEach(idx => {
    const el = document.getElementById(`opt-btn-${idx}`);
    if (el) el.classList.add("disabled-50");
  });
  showToast("50-50 Lifeline applied!", "info");
}

async function finishQuiz() {
  clearInterval(timerInterval);
  const name = document.getElementById("playerNameInput").value.trim() || "Praveen";

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: selectedCategory,
        answers: userAnswers,
        time_seconds: totalTimeElapsed,
        player_name: name
      })
    });
    const result = await res.json();

    document.getElementById("quizScreen").classList.add("hidden");
    document.getElementById("resultsScreen").classList.remove("hidden");

    document.getElementById("resScore").innerText = result.score;
    document.getElementById("resTotal").innerText = result.total;
    document.getElementById("resAccuracy").innerText = `${result.accuracy_pct}%`;
    document.getElementById("resTime").innerText = `${result.time_seconds}s`;

    let rating = "⚡ Lightning";
    if (result.time_seconds > 45) rating = "🐢 Methodical";
    else if (result.time_seconds > 30) rating = "🎯 Sharp";
    document.getElementById("resRating").innerText = rating;

    // Trigger Confetti on 80%+
    if (result.accuracy_pct >= 80) {
      triggerConfetti();
    }

    renderReview(result.review || []);
  } catch (e) {
    showToast("Error submitting quiz", "error");
  }
}

function renderReview(reviewItems) {
  const container = document.getElementById("reviewList");
  container.innerHTML = reviewItems.map(item => `
    <div class="review-item ${item.is_correct ? 'correct' : 'wrong'}">
      <div class="review-q-title">
        <i class="fa-solid ${item.is_correct ? 'fa-check text-cyan' : 'fa-xmark text-red'} mr-1"></i>
        ${escapeHtml(item.question)}
      </div>
      <div>
        <small class="text-dim">Your Answer: </small>
        <strong>${item.user_answer >= 0 ? escapeHtml(item.options[item.user_answer]) : 'Timed Out'}</strong>
        ${!item.is_correct ? ` | <small class="text-dim">Correct Answer: </small><strong class="text-cyan">${escapeHtml(item.options[item.correct_answer])}</strong>` : ''}
      </div>
      <div class="review-explanation">
        <i class="fa-solid fa-lightbulb mr-1 text-gold"></i>
        ${escapeHtml(item.explanation)}
      </div>
    </div>
  `).join("");
}

function toggleReviewSection() {
  const sec = document.getElementById("reviewContainer");
  sec.classList.toggle("hidden");
}

function playAgain() {
  document.getElementById("resultsScreen").classList.add("hidden");
  document.getElementById("lobbyScreen").classList.remove("hidden");
}

// Leaderboard Modal
async function showLeaderboardModal() {
  try {
    const res = await fetch(`/api/leaderboard?category=${encodeURIComponent(selectedCategory)}`);
    const data = await res.json();
    const rows = data.leaderboard || [];

    const tbody = document.getElementById("leaderboardTbody");
    tbody.innerHTML = rows.map((r, i) => `
      <tr>
        <td><span class="rank-badge top-${i+1}">#${i + 1}</span></td>
        <td><strong>${escapeHtml(r.player_name)}</strong></td>
        <td><span class="track-tag">${escapeHtml(r.category)}</span></td>
        <td><strong>${r.score}/${r.total_questions}</strong> (${r.accuracy_pct}%)</td>
        <td>${r.time_seconds}s</td>
      </tr>
    `).join("");

    document.getElementById("leaderboardModal").classList.remove("hidden");
  } catch (e) {
    showToast("Error loading leaderboard", "error");
  }
}

function closeLeaderboardModal() {
  document.getElementById("leaderboardModal").classList.add("hidden");
}

// Simple Lightweight Canvas Confetti
function triggerConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"];

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      r: Math.random() * 6 + 3,
      dx: (Math.random() - 0.5) * 6,
      dy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10
    });
  }

  let frames = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    frames++;
    if (frames < 120) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  animate();
}

// Toast
function showToast(msg, type = "info") {
  const container = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<i class="fa-solid fa-circle-check text-cyan"></i> <span>${escapeHtml(msg)}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
