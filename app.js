const clockEl = document.getElementById("clock");
const hhEl = clockEl.querySelector(".hh");
const mmEl = clockEl.querySelector(".mm");
const ssEl = clockEl.querySelector(".ss");
const meridiemEl = document.getElementById("meridiem");
const dateEl = document.getElementById("date");

const alarmInput = document.getElementById("alarmTime");
const setBtn = document.getElementById("setBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const statusTextEl = statusEl.querySelector(".status-text");
const cardEl = document.querySelector(".card");

let alarmTime = null;
let triggered = false;
let audioCtx = null;
let ringInterval = null;

const pad = (n) => n.toString().padStart(2, "0");

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  hhEl.textContent = pad(h);
  mmEl.textContent = pad(m);
  ssEl.textContent = pad(s);

  meridiemEl.textContent = h < 12 ? "ANTE MERIDIEM" : "POST MERIDIEM";

  dateEl.textContent =
    `${WEEKDAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${pad(now.getDate())}`;

  if (alarmTime && !triggered) {
    const hh = pad(h);
    const mm = pad(m);
    if (hh === alarmTime.h && mm === alarmTime.m && s === 0) {
      triggerAlarm();
    }
  }
}

function setStatus(text, mode) {
  statusTextEl.textContent = text;
  statusEl.classList.remove("active", "ringing");
  if (mode) statusEl.classList.add(mode);
  cardEl.classList.toggle("ringing", mode === "ringing");
}

function setAlarm() {
  const value = alarmInput.value;
  if (!value) {
    setStatus("時刻を選択してください", null);
    return;
  }
  const [h, m] = value.split(":");
  alarmTime = { h, m };
  triggered = false;
  stopRing();
  setStatus(`${h}:${m} にセット中`, "active");
}

function clearAlarm() {
  alarmTime = null;
  triggered = false;
  stopRing();
  setStatus("アラーム未設定", null);
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
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(660, t + 0.35);

  filter.type = "lowpass";
  filter.frequency.value = 2400;

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

  osc.connect(filter).connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.5);
}

function triggerAlarm() {
  triggered = true;
  ensureAudio();
  setStatus("アラーム鳴動中 — タップで停止", "ringing");
  beep();
  ringInterval = setInterval(beep, 700);
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
