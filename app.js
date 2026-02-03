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

function formatYmd(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function setRideDateToToday() {
  const el = document.getElementById("rideDate");
  if (!el) return;
  el.textContent = formatYmd(new Date());
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
  const card = document.querySelector(".card");
  const indicator = document.getElementById("pullRefresh");
  if (!card || !indicator) return;

  const defaultText = "下拉刷新";
  const releaseText = "";
  const refreshingText = "";

  let dragging = false;
  let refreshing = false;
  let startY = 0;
  let moved = 0;
  const showIndicatorThreshold = 90;
  const refreshThreshold = 140;
  const maxPull = 220;
  const resistance = 0.55;
  const refreshHold = 56;

  const setIndicator = (isActive, text, opacity) => {
    indicator.classList.toggle("active", isActive);
    indicator.style.opacity = String(opacity);
    const span = indicator.querySelector("span");
    if (span && text) span.textContent = text;
  };

  const setTranslate = (px, animated) => {
    card.style.transition = animated ? "transform 0.25s ease" : "";
    card.style.transform = `translateY(${px}px)`;
  };

  const reset = () => {
    indicator.style.opacity = "";
    setIndicator(false, defaultText, 0);
    setTranslate(0, true);
  };

  const finishDrag = (shouldReleaseCapture, pointerId) => {
    if (!dragging) return;
    dragging = false;

    if (moved >= refreshThreshold && !refreshing) {
      refreshing = true;
      setIndicator(true, refreshingText, 1);
      setTranslate(refreshHold, true);

      window.setTimeout(() => {
        ensureQrRendered(buildQrContent());
        window.setTimeout(() => {
          refreshing = false;
          moved = 0;
          reset();
        }, 240);
      }, 450);
    } else {
      moved = 0;
      reset();
    }

    if (shouldReleaseCapture) {
      try {
        cardInner.releasePointerCapture(pointerId);
      } catch {
        // ignore
      }
    }
  };

  card.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (refreshing) return;
    dragging = true;
    startY = event.clientY;
    moved = 0;
    setTranslate(0, false);
    setIndicator(false, defaultText, 0);
    card.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  card.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientY - startY;
    if (delta <= 0) {
      moved = 0;
      setTranslate(0, false);
      setIndicator(false, defaultText, 0);
      return;
    }

    moved = Math.min(delta, maxPull);
    const pulled = Math.round(moved * resistance);
    setTranslate(pulled, false);

    const opacity = Math.max(0, Math.min(1, moved / showIndicatorThreshold));
    const active = moved >= showIndicatorThreshold;
    const text = moved >= refreshThreshold ? releaseText : defaultText;
    setIndicator(active, text, opacity);
    event.preventDefault();
  });

  card.addEventListener("pointerup", (event) => {
    finishDrag(true, event.pointerId);
  });

  card.addEventListener("pointercancel", () => {
    finishDrag(false, 0);
  });

  card.addEventListener("pointerleave", () => {
    finishDrag(false, 0);
  });

  // iOS/部分浏览器：额外阻止页面级下拉回弹/原生刷新。
  document.addEventListener(
    "touchmove",
    (e) => {
      if (!e.target.closest(".card")) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

(function init() {
  startCountdown({ initialSeconds: 22 * 60 + 58 });
  ensureQrRendered(buildQrContent());
  setRideDateToToday();
  setupPullRefresh();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
})();
