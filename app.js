const clockEl = document.getElementById("clock");
const hhEl = clockEl.querySelector(".hh");
const mmEl = clockEl.querySelector(".mm");
const secondsTextEl = document.getElementById("seconds");
const secondsRingEl = document.getElementById("secondsRing");
const meridiemEl = document.getElementById("meridiem");
const dateEl = document.getElementById("date");
const countdownEl = document.getElementById("countdown");

const alarmInput = document.getElementById("alarmTime");
const setBtn = document.getElementById("setBtn");
const clearBtn = document.getElementById("clearBtn");
const snoozeBtn = document.getElementById("snoozeBtn");
const stopBtn = document.getElementById("stopBtn");
const defaultButtons = document.getElementById("defaultButtons");
const ringingButtons = document.getElementById("ringingButtons");

const statusEl = document.getElementById("status");
const statusTextEl = statusEl.querySelector(".status-text");
const cardEl = document.querySelector(".card");

const RING_CIRCUMFERENCE = 2 * Math.PI * 16;

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

function nextAlarmDate(h, m, fromDate = new Date()) {
  const target = new Date(fromDate);
  target.setHours(Number(h), Number(m), 0, 0);
  if (target <= fromDate) target.setDate(target.getDate() + 1);
  return target;
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `あと ${h}時間${pad(m)}分`;
  if (m > 0) return `あと ${m}分${pad(s)}秒`;
  return `あと ${s}秒`;
}

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  hhEl.textContent = pad(h);
  mmEl.textContent = pad(m);
  secondsTextEl.textContent = pad(s);

  const offset = RING_CIRCUMFERENCE * (1 - s / 60);
  secondsRingEl.style.strokeDashoffset = offset;

  meridiemEl.textContent = h < 12 ? "ANTE MERIDIEM" : "POST MERIDIEM";

  dateEl.textContent =
    `${WEEKDAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${pad(now.getDate())}`;

  if (alarmTime && !triggered) {
    const target = nextAlarmDate(alarmTime.h, alarmTime.m, now);
    const diff = target - now;
    countdownEl.textContent = formatCountdown(diff);
    countdownEl.classList.add("show");

    if (
      pad(h) === alarmTime.h &&
      pad(m) === alarmTime.m &&
      s === 0
    ) {
      triggerAlarm();
    }
  } else if (!triggered) {
    countdownEl.classList.remove("show");
  }
}

function setStatus(text, mode) {
  statusTextEl.textContent = text;
  statusEl.classList.remove("active", "ringing", "snoozed");
  if (mode) statusEl.classList.add(mode);
  cardEl.classList.toggle("ringing", mode === "ringing");
  ringingButtons.hidden = mode !== "ringing";
  defaultButtons.hidden = mode === "ringing";
}

function setAlarm(h, m) {
  if (h === undefined || m === undefined) {
    const value = alarmInput.value;
    if (!value) {
      setStatus("時刻を選択してください", null);
      return;
    }
    [h, m] = value.split(":");
  }
  alarmTime = { h: pad(h), m: pad(m) };
  alarmInput.value = `${alarmTime.h}:${alarmTime.m}`;
  triggered = false;
  stopRing();
  setStatus(`${alarmTime.h}:${alarmTime.m} にセット中`, "active");
}

function clearAlarm() {
  alarmTime = null;
  triggered = false;
  stopRing();
  countdownEl.classList.remove("show");
  setStatus("アラーム未設定", null);
}

function snoozeAlarm() {
  stopRing();
  triggered = false;
  const target = new Date(Date.now() + 5 * 60 * 1000);
  alarmTime = {
    h: pad(target.getHours()),
    m: pad(target.getMinutes()),
  };
  alarmInput.value = `${alarmTime.h}:${alarmTime.m}`;
  setStatus(`スヌーズ中 — ${alarmTime.h}:${alarmTime.m} に再鳴動`, "snoozed");
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
  setStatus("アラーム鳴動中", "ringing");
  beep();
  ringInterval = setInterval(beep, 700);
}

function stopRing() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

function stopAlarm() {
  stopRing();
  clearAlarm();
}

setBtn.addEventListener("click", () => {
  ensureAudio();
  setAlarm();
});
clearBtn.addEventListener("click", clearAlarm);
snoozeBtn.addEventListener("click", snoozeAlarm);
stopBtn.addEventListener("click", stopAlarm);

setInterval(updateClock, 250);
updateClock();
