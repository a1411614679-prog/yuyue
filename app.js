function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatCountdown(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}分${pad2(seconds)}秒`;
}

function seedFromNow() {
  const now = new Date();
  return [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ].join("-");
}

function buildQrContent() {
  return `yuyue://metro/reservation?seed=${encodeURIComponent(seedFromNow())}`;
}

function ensureQrRendered(text) {
  const container = document.getElementById("qrcode");
  if (!container) return;
  container.innerHTML = "";

  // eslint-disable-next-line no-undef
  new QRCode(container, {
    text,
    width: 170,
    height: 170,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });
}

function startCountdown(options) {
  const el = document.getElementById("countdown");
  if (!el) return;

  let remainingSeconds = options.initialSeconds;

  const tick = () => {
    el.textContent = formatCountdown(remainingSeconds);
    remainingSeconds -= 1;

    if (remainingSeconds < 0) {
      clearInterval(timer);
      el.textContent = "已失效";
    }
  };

  tick();
  const timer = setInterval(tick, 1000);

  return () => clearInterval(timer);
}

function setupPullRefresh() {
  const wrap = document.querySelector(".qr-wrap");
  const indicator = document.getElementById("pullRefresh");
  if (!wrap || !indicator) return;

  let dragging = false;
  let startY = 0;
  let moved = 0;
  const showIndicatorThreshold = 80;
  const refreshThreshold = 110;

  const reset = () => {
    wrap.style.transition = "transform 0.25s ease";
    wrap.style.transform = "translateY(0)";
    indicator.classList.remove("active");
  };

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    if (moved >= refreshThreshold) {
      ensureQrRendered(buildQrContent());
    }
    moved = 0;
    reset();
  };

  wrap.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    dragging = true;
    startY = event.clientY;
    moved = 0;
    wrap.style.transition = "";
    wrap.setPointerCapture(event.pointerId);
  });

  wrap.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientY - startY;
    if (delta <= 0) {
      moved = 0;
      wrap.style.transform = "translateY(0)";
      indicator.classList.remove("active");
      return;
    }
    moved = Math.min(delta, 150);
    wrap.style.transform = `translateY(${moved / 2}px)`;
    if (moved >= showIndicatorThreshold) {
      indicator.classList.add("active");
    } else {
      indicator.classList.remove("active");
    }
  });

  wrap.addEventListener("pointerup", (event) => {
    const wasDragging = dragging;
    finishDrag();
    if (wasDragging) {
      wrap.releasePointerCapture(event.pointerId);
    }
  });
  wrap.addEventListener("pointercancel", finishDrag);
  wrap.addEventListener("pointerleave", finishDrag);
}

(function init() {
  startCountdown({ initialSeconds: 22 * 60 + 58 });
  ensureQrRendered(buildQrContent());
  setupPullRefresh();
})();
