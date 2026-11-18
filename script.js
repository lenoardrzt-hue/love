// =====================================================================
// PENGATURAN UTAMA (PASSCODE, TANGGAL & FILE SOUND KHUSUS WRONG & NAH)
// =====================================================================
const KODE_RAHASIA = "1909";
const TANGGAL_MULAI = "2026-09-19T00:00:00";
const TANGGAL_ANNIV = "2026-11-19T00:00:00";

// Ganti nama file di bawah sesuai nama file audio di folder kamu (.mp3 / .wav / .ogg)
const FILE_SUARA = {
  wrong: "wrong.mp3", // File suara saat pilih salah / salah passcode
  nah: "nah.mp3",     // File suara khusus saat klik tombol "nah"
};

const TEKS_SURAT = `ngl, i never expected us to get this close this fast.

since day one, the little things about you have effortlessly made my days brighter — your laugh, your random stories, and how peaceful everything feels whenever we talk.

made this little archive just for you, so you know how deeply appreciated you are. ♥`;

// =====================================================================
// 1. MESIN AUDIO: FILE PRIBADI (WRONG & NAH) + SOUND BAWAAN + VIDEO SYNC
// =====================================================================
const bgMusic = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-toggle");
const momentVideo = document.getElementById("moment-video");

// Preload khusus file suara "wrong" dan "nah"
const sfxPlayers = {
  wrong: new Audio(FILE_SUARA.wrong),
  nah: new Audio(FILE_SUARA.nah),
};

Object.values(sfxPlayers).forEach((audio) => {
  audio.preload = "auto";
  audio.volume = 0.9;
});

let audioCtx = null;
let isSoundEnabled = false;
let isBgmActive = false;
let pausedByVideo = false;
let useSynthBgm = false;
let synthTimer = null;
let melodyStep = 0;

const CUTE_MELODY = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880.00, 698.46,
  659.25, 783.99, 1046.50, 783.99,
  587.33, 659.25, 523.25, 0
];

function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playTone(freq, duration, type = "sine", volume = 0.12, delay = 0, slideTo = null) {
  if (!freq) return;
  ensureAudioContext();

  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playCustomSfx(key, fallbackFn) {
  const player = sfxPlayers[key];
  if (player) {
    player.pause();
    player.currentTime = 0;
    const playPromise = player.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== "AbortError" && fallbackFn) {
          fallbackFn();
        }
      });
    }
  } else if (fallbackFn) {
    fallbackFn();
  }
}

// 1) Suara Tombol Biasa (Bawaan)
function playClickSfx() {
  playTone(680, 0.07, "triangle", 0.12, 0, 920);
}

// 2) Suara Benar & Tombol YES (Bawaan)
function playCorrectSfx() {
  playTone(523.25, 0.13, "triangle", 0.18, 0.00);
  playTone(659.25, 0.13, "triangle", 0.18, 0.09);
  playTone(783.99, 0.15, "triangle", 0.18, 0.18);
  playTone(1046.50, 0.34, "sine", 0.22, 0.27);
}

// 3) Suara Pilih Salah (Memakai FILE_SUARA.wrong)
function playWrongSfx() {
  playCustomSfx("wrong", () => {
    playTone(220.00, 0.14, "square", 0.11, 0.00, 205);
    playTone(155.56, 0.28, "square", 0.12, 0.13, 140);
  });
}

// 4) Suara Khusus Tombol "nah" (Memakai FILE_SUARA.nah)
function playNahSfx() {
  playCustomSfx("nah", () => {
    playTone(330, 0.09, "triangle", 0.18, 0.00, 640);
    playTone(560, 0.15, "sine", 0.16, 0.08, 280);
  });
}

// Kontrol Backsound
function startSynthBgm() {
  if (synthTimer) return;
  useSynthBgm = true;
  isBgmActive = true;

  synthTimer = setInterval(() => {
    if (!isBgmActive || !isSoundEnabled || pausedByVideo) return;
    const note = CUTE_MELODY[melodyStep % CUTE_MELODY.length];
    if (note > 0) {
      playTone(note, 0.32, "sine", 0.055, 0);
      playTone(note * 0.5, 0.32, "triangle", 0.025, 0);
    }
    melodyStep++;
  }, 360);
}

function stopSynthBgm() {
  if (synthTimer) {
    clearInterval(synthTimer);
    synthTimer = null;
  }
}

function startBgm() {
  if (!isSoundEnabled || pausedByVideo) return;
  isBgmActive = true;

  if (useSynthBgm) {
    startSynthBgm();
    return;
  }

  bgMusic.volume = 0.45;
  bgMusic.play().catch(() => {
    startSynthBgm();
  });
}

function pauseBgm() {
  isBgmActive = false;
  if (!bgMusic.paused) {
    bgMusic.pause();
  }
  stopSynthBgm();
}

// Suara klik untuk tombol navigasi & polaroid (kecuali YES, NO, dan opsi kuis)
document.addEventListener("click", (e) => {
  const targetBtn = e.target.closest("button, .polaroid");
  if (!targetBtn) return;

  ensureAudioContext();

  if (
    targetBtn.id === "yesBtn" ||
    targetBtn.id === "noBtn" ||
    targetBtn.classList.contains("btn-option")
  ) {
    return;
  }

  playClickSfx();
});

// Sinkronisasi Video & Backsound:
// Putar Video -> Backsound MATI | Pause / Selesai Video -> Backsound HIDUP ULANG
if (momentVideo) {
  momentVideo.addEventListener("play", () => {
    if (isSoundEnabled) {
      pausedByVideo = true;
      pauseBgm();
    }
  });

  momentVideo.addEventListener("pause", () => {
    if (pausedByVideo && isSoundEnabled) {
      pausedByVideo = false;
      startBgm();
    }
  });

  momentVideo.addEventListener("ended", () => {
    if (pausedByVideo && isSoundEnabled) {
      pausedByVideo = false;
      startBgm();
    }
  });
}

// =====================================================================
// 2. AMBIENT HUJAN LOVE PIXEL DARI ATAS KE BAWAH
// =====================================================================
const rainCanvas = document.getElementById("heartRainCanvas");
const rainCtx = rainCanvas.getContext("2d");

let width = (rainCanvas.width = window.innerWidth);
let height = (rainCanvas.height = window.innerHeight);

window.addEventListener("resize", () => {
  width = rainCanvas.width = window.innerWidth;
  height = rainCanvas.height = window.innerHeight;
});

const HEART_COLORS = ["#e23b4e", "#d97b73", "#f19cb2", "#f6bfd0", "#e9667a"];
const PIXEL_HEART = [
  [0, 1, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
];

function drawPixelHeart(ctx, x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const px = size / 7;
  for (let r = 0; r < PIXEL_HEART.length; r++) {
    for (let c = 0; c < PIXEL_HEART[r].length; c++) {
      if (PIXEL_HEART[r][c]) {
        ctx.fillRect(
          Math.round(x - size / 2 + c * px),
          Math.round(y - size / 2 + r * px),
          Math.ceil(px),
          Math.ceil(px)
        );
      }
    }
  }
  ctx.restore();
}

const rainHearts = [];
const burstParticles = [];

function createRainHeart(randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -20 - Math.random() * 120,
    size: 10 + Math.random() * 10,
    vy: 0.75 + Math.random() * 1.2,
    swayAmp: 0.35 + Math.random() * 0.6,
    swaySpeed: 0.015 + Math.random() * 0.02,
    phase: Math.random() * Math.PI * 2,
    color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    alpha: 0.45 + Math.random() * 0.45,
  };
}

for (let i = 0; i < 40; i++) {
  rainHearts.push(createRainHeart(true));
}

function spawnHeartBurst(originX, originY, count = 24) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 1.8 + Math.random() * 3.4;
    burstParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.4,
      gravity: 0.08,
      size: 11 + Math.random() * 8,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      life: 1,
    });
  }
}

function animateRain() {
  rainCtx.clearRect(0, 0, width, height);

  for (let i = 0; i < rainHearts.length; i++) {
    const h = rainHearts[i];
    h.y += h.vy;
    h.phase += h.swaySpeed;
    h.x += Math.sin(h.phase) * h.swayAmp;

    if (h.y > height + 24) {
      rainHearts[i] = createRainHeart(false);
    }
    drawPixelHeart(rainCtx, h.x, h.y, h.size, h.color, h.alpha);
  }

  for (let i = burstParticles.length - 1; i >= 0; i--) {
    const p = burstParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life -= 0.018;

    if (p.life <= 0) {
      burstParticles.splice(i, 1);
    } else {
      drawPixelHeart(rainCtx, p.x, p.y, p.size, p.color, p.life);
    }
  }

  requestAnimationFrame(animateRain);
}
animateRain();

// =====================================================================
// 3. KUCING HITAM PIXEL MEMEGANG LOVE
// =====================================================================
const catCanvas = document.getElementById("pixelCatCanvas");
const catCtx = catCanvas.getContext("2d");

const CAT_GRID = [
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 2, 2, 2, 1, 1, 1, 2, 2, 2, 1, 0],
  [0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0],
  [0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0],
  [1, 1, 3, 3, 1, 3, 3, 3, 1, 3, 3, 1, 1],
  [1, 1, 1, 1, 4, 4, 1, 4, 4, 1, 1, 1, 1],
  [1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1],
  [1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1],
  [0, 1, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 4, 4, 4, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 0, 4, 0, 1, 1, 0, 0, 0],
];

let isBlinking = false;
let catShakeFrames = 0;

setInterval(() => {
  isBlinking = true;
  setTimeout(() => {
    isBlinking = false;
  }, 150);
}, 3200);

function drawPixelCat(time) {
  if (!catCtx) return;
  catCtx.clearRect(0, 0, catCanvas.width, catCanvas.height);

  const px = 10;
  const gridW = CAT_GRID[0].length * px;
  const gridH = CAT_GRID.length * px;
  const baseX = Math.floor((catCanvas.width - gridW) / 2);
  const bobY = Math.sin(time * 0.0045) * 2;
  const shakeX = catShakeFrames > 0 ? Math.sin(catShakeFrames * 1.4) * 5 : 0;
  if (catShakeFrames > 0) catShakeFrames--;

  const baseY = Math.floor((catCanvas.height - gridH) / 2 + bobY);

  for (let r = 0; r < CAT_GRID.length; r++) {
    for (let c = 0; c < CAT_GRID[r].length; c++) {
      const cell = CAT_GRID[r][c];
      if (cell === 0) continue;

      if (cell === 1) {
        catCtx.fillStyle = "#1a1517";
      } else if (cell === 2) {
        catCtx.fillStyle = isBlinking ? "#1a1517" : "#ffffff";
      } else if (cell === 3) {
        catCtx.fillStyle = "#f48fb1";
      } else if (cell === 4) {
        catCtx.fillStyle = "#e23b4e";
      }

      catCtx.fillRect(baseX + shakeX + c * px, baseY + r * px, px, px);
    }
  }

  requestAnimationFrame(drawPixelCat);
}
requestAnimationFrame(drawPixelCat);

// =====================================================================
// 4. LOGIKA PASSCODE & TOGGLE MUSIK
// =====================================================================
const passcodeInput = document.getElementById("passcode");

passcodeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    unlockStory();
  }
});

function unlockStory() {
  const input = passcodeInput.value.trim();
  const errorMsg = document.getElementById("error-msg");

  if (input === KODE_RAHASIA) {
    errorMsg.textContent = "";
    ensureAudioContext();
    playCorrectSfx();

    isSoundEnabled = true;
    musicBtn.textContent = "SOUND: ON";
    musicBtn.classList.remove("hidden");
    startBgm();

    nextStep(1);
    startTypewriter();
    calculateAnniversarySpan();
  } else {
    playWrongSfx();
    errorMsg.textContent = "wrong code, try again.";
  }
}

function toggleMusic() {
  ensureAudioContext();
  if (isSoundEnabled) {
    isSoundEnabled = false;
    pausedByVideo = false;
    pauseBgm();
    musicBtn.textContent = "SOUND: OFF";
  } else {
    isSoundEnabled = true;
    musicBtn.textContent = "SOUND: ON";
    if (momentVideo && !momentVideo.paused) {
      pausedByVideo = true;
    } else {
      startBgm();
    }
  }
}

function nextStep(stepNumber) {
  if (momentVideo && !momentVideo.paused) {
    momentVideo.pause();
  }

  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(`step-${stepNumber}`).classList.add("active");
}

// =====================================================================
// 5. TYPEWRITER SURAT
// =====================================================================
function startTypewriter() {
  const target = document.getElementById("typewriter-text");
  const nextBtn = document.getElementById("btn-step-1");
  target.textContent = "";
  let index = 0;

  function type() {
    if (index < TEKS_SURAT.length) {
      target.textContent += TEKS_SURAT.charAt(index);
      index++;
      setTimeout(type, 34);
    } else {
      nextBtn.classList.remove("hidden");
    }
  }
  type();
}

// =====================================================================
// 6. HITUNG HARI DARI 19 09 2026 SAMPAI 19 11 2026
// =====================================================================
function calculateAnniversarySpan() {
  const startDate = new Date(TANGGAL_MULAI).getTime();
  const endDate = new Date(TANGGAL_ANNIV).getTime();
  const diff = Math.max(0, endDate - startDate);

  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const totalMonths = 2;
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const totalMinutes = Math.floor(diff / (1000 * 60));

  document.getElementById("days").textContent = totalDays;
  document.getElementById("months").textContent = totalMonths;
  document.getElementById("hours").textContent = totalHours.toLocaleString("en-US");
  document.getElementById("minutes").textContent = totalMinutes.toLocaleString("en-US");
}

// =====================================================================
// 7. GALERI POLAROID
// =====================================================================
function toggleCaption(element) {
  const note = element.querySelector(".polaroid-note");
  note.classList.toggle("hidden");
}

// =====================================================================
// 8. KUIS ALKITAB KITA BERDUA (JAWABAN SALAH DITAHAN & BUNYI WRONG)
// =====================================================================
let currentQuestion = 1;

function answerQuiz(qNum, choice) {
  const reaction = document.getElementById("quiz-reaction");
  const nextBtn = document.getElementById("next-quiz-btn");

  if (qNum === 1) {
    if (choice === "A") {
      playCorrectSfx();
      reaction.textContent = "spot on — 'love is patient, love is kind' hits different with you ♥";
      nextBtn.classList.remove("hidden");
    } else {
      playWrongSfx();
      nextBtn.classList.add("hidden");
      reaction.textContent = "nope, wrong chapter — pick the right one first!";
    }
  } else if (qNum === 2) {
    if (choice === "B") {
      playCorrectSfx();
      reaction.textContent = "no cap, 100% us. grateful to walk in faith together ♥";
      nextBtn.classList.remove("hidden");
    } else {
      playWrongSfx();
      nextBtn.classList.add("hidden");
      reaction.textContent = "bro really picked that?? try again!";
    }
  }
}

function loadNextQuestion() {
  currentQuestion++;
  const qTitle = document.getElementById("quiz-question");
  const qOptions = document.getElementById("quiz-options");
  const reaction = document.getElementById("quiz-reaction");
  const nextBtn = document.getElementById("next-quiz-btn");

  reaction.textContent = "";
  nextBtn.classList.add("hidden");

  if (currentQuestion === 2) {
    qTitle.textContent = "02: ecclesiastes 4:9 says 'two are better than one' — what's our real-life version of that?";
    qOptions.innerHTML = `
      <button class="btn-option" onclick="answerQuiz(2, 'A')">ignoring each other's texts all day</button>
      <button class="btn-option" onclick="answerQuiz(2, 'B')">praying together &amp; having each other's back</button>
    `;
  } else {
    document.getElementById("quiz-section").classList.add("hidden");
    document.getElementById("final-trap").classList.remove("hidden");
  }
}

// =====================================================================
// 9. PERTANYAAN AKHIR: "nah" (FILE_SUARA.nah) & "YES" (SOUND CORRECT)
// =====================================================================
const ginghamArea = document.getElementById("ginghamArea");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
let yesScale = 1;

function moveNoButtonRandomly() {
  const areaRect = ginghamArea.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();
  const padding = 14;

  const maxX = Math.max(padding, areaRect.width - noRect.width - padding);
  const maxY = Math.max(padding, areaRect.height - noRect.height - padding);

  if (noBtn.parentElement !== ginghamArea) {
    ginghamArea.appendChild(noBtn);
  }

  let randomX = padding + Math.random() * (maxX - padding);
  let randomY = padding + Math.random() * (maxY - padding);

  const centerX = areaRect.width / 2;
  const centerY = areaRect.height * 0.62;
  if (Math.hypot(randomX + noRect.width / 2 - centerX, randomY + noRect.height / 2 - centerY) < 95) {
    randomY = padding + Math.random() * 36;
  }

  noBtn.style.position = "absolute";
  noBtn.style.left = `${Math.round(randomX)}px`;
  noBtn.style.top = `${Math.round(randomY)}px`;
}

// Klik "nah" -> Putar FILE_SUARA.nah, tombol kabur, YES geser ke tengah & membesar
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  playNahSfx();

  yesScale = Math.min(yesScale + 0.18, 1.85);
  yesBtn.style.setProperty("--yes-scale", yesScale.toFixed(2));
  yesBtn.classList.add("centered-grow");

  moveNoButtonRandomly();
  catShakeFrames = 14;
});

// Klik "YES" -> Bunyi sound correct & masuk ke layar penutup
function finishAll() {
  playCorrectSfx();

  const rect = yesBtn.getBoundingClientRect();
  spawnHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 32);

  noBtn.style.display = "none";
  document.getElementById("final-trap").classList.add("hidden");
  document.getElementById("ending-message").classList.remove("hidden");
}
