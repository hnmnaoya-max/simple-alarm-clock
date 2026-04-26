const clockEl = document.getElementById("clock");
const alarmInput = document.getElementById("alarmTime");
const setBtn = document.getElementById("setBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

let alarmTime = null;
let triggered = false;
let audioCtx = null;
let ringInterval = null;

function pad(n) {
  return n.toString().padStart(2, "0");
}

function updateClock() {
  const now = new Date();
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  if (alarmTime && !triggered) {
    if (hh === alarmTime.h && mm === alarmTime.m && now.getSeconds() === 0) {
      triggerAlarm();
    }
  }
}

function setAlarm() {
  const value = alarmInput.value;
  if (!value) {
    statusEl.textContent = "時刻を選択してください";
    statusEl.className = "status";
    return;
  }
  const [h, m] = value.split(":");
  alarmTime = { h, m };
  triggered = false;
  stopRing();
  statusEl.textContent = `${h}:${m} にアラームをセット`;
  statusEl.className = "status active";
}

function clearAlarm() {
  alarmTime = null;
  triggered = false;
  stopRing();
  statusEl.textContent = "アラーム未設定";
  statusEl.className = "status";
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function beep() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
}

function triggerAlarm() {
  triggered = true;
  ensureAudio();
  statusEl.textContent = "アラーム鳴動中（解除を押して停止）";
  statusEl.className = "status ringing";
  beep();
  ringInterval = setInterval(beep, 600);
}

function stopRing() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

setBtn.addEventListener("click", () => {
  ensureAudio();
  setAlarm();
});
clearBtn.addEventListener("click", clearAlarm);

setInterval(updateClock, 250);
updateClock();
