/* =====================================================================
   CHECKPOINT v1 (SAVED VERSION - HUMAN TOUCH EDITION) — JAVASCRIPT
   ===================================================================== */

// =====================================================================
// 1. AMBIENT HUJAN LOVE DARI ATAS KE BAWAH
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

// Matriks Pixel Heart 7x6
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
const TOTAL_RAIN_HEARTS = 42;

function createRainHeart(randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -20 - Math.random() * 120,
    size: 10 + Math.random() * 11,
    vy: 0.75 + Math.random() * 1.25, // Kecepatan positif = turun dari atas ke bawah
    swayAmp: 0.35 + Math.random() * 0.65,
    swaySpeed: 0.015 + Math.random() * 0.02,
    phase: Math.random() * Math.PI * 2,
    color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    alpha: 0.45 + Math.random() * 0.5,
  };
}

for (let i = 0; i < TOTAL_RAIN_HEARTS; i++) {
  rainHearts.push(createRainHeart(true));
}

const burstParticles = [];

function spawnHeartBurst(originX, originY, count = 18) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 1.8 + Math.random() * 3.4;
    burstParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
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
// 2. LOGIKA BUSUR & PANAH CUPID (LENGKUNGAN KAYU DI ATAS, SENAR DI BAWAH)
// =====================================================================
const bowStage = document.getElementById("bowStage");
const bowWood = document.getElementById("bowWood");
const bowWoodHighlight = document.getElementById("bowWoodHighlight");
const bowString = document.getElementById("bowString");
const tipLeft = document.getElementById("tipLeft");
const tipRight = document.getElementById("tipRight");
const arrowGroup = document.getElementById("arrowGroup");
const envelopeWrap = document.getElementById("envelopeWrap");
const envelopeFlap = document.getElementById("envelopeFlap");
const stuckArrow = document.getElementById("stuckArrow");
const sceneCupid = document.getElementById("sceneCupid");
const sceneWindow = document.getElementById("sceneWindow");

let isPulling = false;
let isFiring = false;
let arrowDone = false;
let startY = 0;
let pullAmount = 0; // 0 .. 52
let arrowOffsetY = 0;

function renderBowGeometry(pull, trembleX = 0) {
  // Lengkungan kayu menghadap ke atas (∩), ujung kiri & kanan ikut melentur saat senar ditarik
  const tipDrop = pull * 0.22;
  const tipInward = pull * 0.14;
  const lx = 42 + tipInward;
  const rx = 218 - tipInward;
  const ty = 155 + tipDrop;
  const archPeakY = 75 + pull * 0.12;

  bowWood.setAttribute("d", `M ${lx} ${ty} Q 130 ${archPeakY} ${rx} ${ty}`);
  bowWoodHighlight.setAttribute("d", `M ${lx + 10} ${ty - 6} Q 130 ${archPeakY + 7} ${rx - 10} ${ty - 6}`);
  tipLeft.setAttribute("cx", lx);
  tipLeft.setAttribute("cy", ty);
  tipRight.setAttribute("cx", rx);
  tipRight.setAttribute("cy", ty);

  // Senar di bawah ditarik ke bawah
  const stringMidY = ty + pull * 1.15;
  bowString.setAttribute("d", `M ${lx} ${ty} Q ${130 + trembleX} ${stringMidY} ${rx} ${ty}`);

  if (!isFiring && !arrowDone) {
    const arrowY = 125 + pull * 0.72;
    arrowGroup.setAttribute("transform", `translate(${130 + trembleX}, ${arrowY})`);
  }
}

function shootArrow() {
  if (isFiring || arrowDone) return;
  isFiring = true;

  // Kembalikan senar ke posisi semula dengan pantulan elastis
  const releasePull = pullAmount;
  pullAmount = 0;
  renderBowGeometry(0, 0);

  const envRect = envelopeWrap.getBoundingClientRect();
  const bowRect = bowStage.getBoundingClientRect();
  const targetDistance = bowRect.top + 125 - (envRect.top + envRect.height * 0.55);

  let currentFly = releasePull * 0.72;
  const speed = 15;

  function flyStep() {
    currentFly -= speed;
    arrowGroup.setAttribute("transform", `translate(130, ${125 + currentFly})`);

    if (Math.abs(currentFly) >= targetDistance) {
      // Panah mengenai tengah amplop!
      arrowDone = true;
      isFiring = false;
      arrowGroup.style.opacity = "0";

      stuckArrow.classList.add("visible");
      envelopeWrap.classList.add("hit-bounce");

      const hitX = envRect.left + envRect.width / 2;
      const hitY = envRect.top + envRect.height / 2;
      spawnHeartBurst(hitX, hitY, 24);

      setTimeout(() => {
        envelopeWrap.classList.remove("hit-bounce");
        envelopeFlap.classList.add("open");
      }, 320);

      // Buka tampilan jendela kucing pixel (Foto 2)
      setTimeout(() => {
        sceneCupid.classList.remove("active");
        sceneCupid.classList.add("hidden");
        sceneWindow.classList.remove("hidden");
        sceneWindow.classList.add("active");
        sceneWindow.setAttribute("aria-hidden", "false");
      }, 1150);
      return;
    }

    requestAnimationFrame(flyStep);
  }

  requestAnimationFrame(flyStep);
}

// Mendukung tarik-lepas maupun klik langsung pada busur
bowStage.addEventListener("pointerdown", (e) => {
  if (isFiring || arrowDone) return;
  isPulling = true;
  startY = e.clientY;
  pullAmount = 16; // Tarikan awal langsung terasa saat ditekan
  renderBowGeometry(pullAmount, 0);
  bowStage.setPointerCapture(e.pointerId);
});

bowStage.addEventListener("pointermove", (e) => {
  if (!isPulling || isFiring || arrowDone) return;
  const deltaY = Math.max(0, e.clientY - startY);
  pullAmount = Math.min(52, 16 + deltaY * 0.55);
  const tremble = pullAmount > 34 ? (Math.random() - 0.5) * 1.8 : 0;
  renderBowGeometry(pullAmount, tremble);
});

bowStage.addEventListener("pointerup", () => {
  if (!isPulling) return;
  isPulling = false;
  shootArrow();
});

bowStage.addEventListener("pointercancel", () => {
  if (!isPulling) return;
  isPulling = false;
  shootArrow();
});

// Aksesibilitas keyboard (Enter / Spasi)
bowStage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    pullAmount = 32;
    renderBowGeometry(pullAmount, 0);
    setTimeout(shootArrow, 140);
  }
});

// =====================================================================
// 3. KUCING HITAM PIXEL MEMEGANG LOVE (KEDIP ALAMI & REAKSI KAGET)
// =====================================================================
const catCanvas = document.getElementById("pixelCatCanvas");
const catCtx = catCanvas.getContext("2d");

// Grid 17x15 kucing hitam pixel seperti Foto 2
// 0: transparan, 1: hitam kucing (#1e181a), 2: mata putih (#ffffff), 3: pipi/hidung pink (#f38ba8), 4: love merah (#e23b4e)
const CAT_GRID = [
  [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 3, 3, 1, 1, 1, 3, 3, 3, 1, 1, 1, 3, 3, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 4, 4, 1, 1, 1, 4, 4, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 4, 4, 4, 4, 1, 4, 4, 4, 4, 1, 1, 1, 0],
  [0, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 4, 4, 4, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0],
];

let isBlinking = false;
let catShakeFrames = 0;

setInterval(() => {
  isBlinking = true;
  setTimeout(() => {
    isBlinking = false;
  }, 160);
}, 3400);

function drawPixelCat(time) {
  catCtx.clearRect(0, 0, catCanvas.width, catCanvas.height);

  const px = 9;
  const gridW = CAT_GRID[0].length * px;
  const gridH = CAT_GRID.length * px;
  const baseX = Math.floor((catCanvas.width - gridW) / 2);
  const bobY = Math.sin(time * 0.004) * 2;
  const shakeX = catShakeFrames > 0 ? Math.sin(catShakeFrames * 1.4) * 5 : 0;
  if (catShakeFrames > 0) catShakeFrames--;

  const baseY = Math.floor((catCanvas.height - gridH) / 2 + bobY);

  for (let r = 0; r < CAT_GRID.length; r++) {
    for (let c = 0; c < CAT_GRID[r].length; c++) {
      const cell = CAT_GRID[r][c];
      if (cell === 0) continue;

      if (cell === 1) {
        catCtx.fillStyle = "#1e181a";
      } else if (cell === 2) {
        // Kedip alami: saat berkedip mata menjadi hitam seperti kelopak menutup
        catCtx.fillStyle = isBlinking ? "#1e181a" : "#ffffff";
      } else if (cell === 3) {
        catCtx.fillStyle = "#f497b6";
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
// 4. TOMBOL YES & NO (NO PINDAH SAAT DIKLIK, YES GESER KE TENGAH & MEMBESAR)
// =====================================================================
const ginghamArea = document.getElementById("ginghamArea");
const questionView = document.getElementById("questionView");
const celebrationView = document.getElementById("celebrationView");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const anniversaryVideo = document.getElementById("anniversaryVideo");
const videoPlaceholderMsg = document.getElementById("videoPlaceholderMsg");

let noClickCount = 0;
let yesScale = 1;

function moveNoButtonRandomly() {
  const areaRect = ginghamArea.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();
  const padding = 14;

  const maxX = Math.max(padding, areaRect.width - noRect.width - padding);
  const maxY = Math.max(padding, areaRect.height - noRect.height - padding);

  // Pindahkan tombol NO ke dalam area kotak gingham agar bebas melompat di sekitar kotak
  if (noBtn.parentElement !== ginghamArea) {
    ginghamArea.appendChild(noBtn);
  }

  let randomX = padding + Math.random() * (maxX - padding);
  let randomY = padding + Math.random() * (maxY - padding);

  // Hindari menumpuk persis di bagian tengah bawah tempat tombol YES membesar
  const centerX = areaRect.width / 2;
  const centerY = areaRect.height - 54;
  if (Math.hypot(randomX + noRect.width / 2 - centerX, randomY + noRect.height / 2 - centerY) < 75) {
    randomY = padding + Math.random() * 48;
  }

  noBtn.style.position = "absolute";
  noBtn.style.left = `${Math.round(randomX)}px`;
  noBtn.style.top = `${Math.round(randomY)}px`;
}

// Tombol NO HANYA berpindah saat benar-benar DIKLIK (bukan saat cursor menyentuh)
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  noClickCount++;

  // 1. Geser tombol YES ke tengah & perbesar setiap klik NO
  yesScale += 0.18;
  yesBtn.style.setProperty("--yes-scale", yesScale.toFixed(2));
  yesBtn.classList.add("centered-grow");

  // 2. Pindahkan tombol NO ke lokasi acak di dalam kotak gingham
  moveNoButtonRandomly();

  // 3. Reaksi kaget lucu dari kucing pixel
  catShakeFrames = 14;
});

// Tombol YES membuka tampilan video perayaan
yesBtn.addEventListener("click", () => {
  const rect = yesBtn.getBoundingClientRect();
  spawnHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 32);

  // Sembunyikan tombol NO jika sudah dipindahkan ke ginghamArea
  noBtn.style.display = "none";
  questionView.classList.add("hidden");
  celebrationView.classList.remove("hidden");

  // Cek apakah user sudah mengisi atribut src="" pada tag <video> di index.html
  const videoSrc = (anniversaryVideo.getAttribute("src") || "").trim();
  if (videoSrc !== "") {
    videoPlaceholderMsg.style.display = "none";
    anniversaryVideo.play().catch(() => {
      // Tetap siap diputar manual via tombol play jika autoplay dibatasi browser
    });
  } else {
    videoPlaceholderMsg.style.display = "flex";
  }
});