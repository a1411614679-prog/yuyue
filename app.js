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

function ensureQrRendered(text) {
  const container = document.getElementById("qrcode");
  if (!container) return;
  container.innerHTML = "";

  // eslint-disable-next-line no-undef
  new QRCode(container, {
    text,
    width: 260,
    height: 260,
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

(function init() {
  // 默认展示和截图一致的 22分58秒
  startCountdown({ initialSeconds: 22 * 60 + 58 });

  // 二维码内容随便即可（这里用时间种子避免完全固定）
  ensureQrRendered(`yuyue://metro/reservation?seed=${encodeURIComponent(seedFromNow())}`);
})();
