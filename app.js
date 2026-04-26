/* ====== Alarm UI 要素 ====== */
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

/* ====== Auth UI 要素 ====== */
const loggedOutView = document.getElementById("loggedOutView");
const loggedInView = document.getElementById("loggedInView");
const configWarn = document.getElementById("configWarn");
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInBtn = document.getElementById("signInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const signOutBtn = document.getElementById("signOutBtn");
const authMsg = document.getElementById("authMsg");
const userEmailEl = document.getElementById("userEmail");
const userAvatar = document.getElementById("userAvatar");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");

/* ====== 状態 ====== */
const RING_CIRCUMFERENCE = 2 * Math.PI * 16;
let alarmTime = null;
let triggered = false;
let audioCtx = null;
let ringInterval = null;

let supa = null;
let currentUser = null;

const pad = (n) => n.toString().padStart(2, "0");

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/* ====== Clock ====== */
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

  secondsRingEl.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - s / 60);

  meridiemEl.textContent = h < 12 ? "ANTE MERIDIEM" : "POST MERIDIEM";
  dateEl.textContent =
    `${WEEKDAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${pad(now.getDate())}`;

  if (alarmTime && !triggered) {
    const target = nextAlarmDate(alarmTime.h, alarmTime.m, now);
    countdownEl.textContent = formatCountdown(target - now);
    countdownEl.classList.add("show");

    if (pad(h) === alarmTime.h && pad(m) === alarmTime.m && s === 0) {
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
  alarmTime = { h: pad(target.getHours()), m: pad(target.getMinutes()) };
  alarmInput.value = `${alarmTime.h}:${alarmTime.m}`;
  setStatus(`スヌーズ中 — ${alarmTime.h}:${alarmTime.m} に再鳴動`, "snoozed");
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
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

async function triggerAlarm() {
  triggered = true;
  ensureAudio();
  setStatus("アラーム鳴動中", "ringing");
  beep();
  ringInterval = setInterval(beep, 700);

  if (currentUser && supa && alarmTime) {
    try {
      await supa.from("alarm_history").insert({
        user_id: currentUser.id,
        alarm_time: `${alarmTime.h}:${alarmTime.m}`,
      });
      loadHistory();
    } catch (e) {
      console.error("history insert failed:", e);
    }
  }
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

/* ====== Supabase 認証・履歴 ====== */
function isConfigured() {
  const c = window.SUPABASE_CONFIG;
  return (
    c &&
    c.url &&
    c.anonKey &&
    !c.url.includes("YOUR_") &&
    !c.anonKey.includes("YOUR_")
  );
}

function showConfigWarn() {
  loggedOutView.hidden = true;
  loggedInView.hidden = true;
  configWarn.hidden = false;
}

function setAuthMessage(text, kind) {
  authMsg.textContent = text || "";
  authMsg.classList.remove("error", "success");
  if (kind) authMsg.classList.add(kind);
}

function setAuthLoading(loading) {
  signInBtn.disabled = loading;
  signUpBtn.disabled = loading;
  emailInput.disabled = loading;
  passwordInput.disabled = loading;
}

function showLoggedIn(user) {
  currentUser = user;
  userEmailEl.textContent = user.email || user.id;
  userAvatar.textContent = (user.email || "?").charAt(0).toUpperCase();
  loggedOutView.hidden = true;
  loggedInView.hidden = false;
  configWarn.hidden = true;
  loadHistory();
}

function showLoggedOut() {
  currentUser = null;
  loggedOutView.hidden = false;
  loggedInView.hidden = true;
  configWarn.hidden = true;
  setAuthMessage("");
  passwordInput.value = "";
}

function formatHistoryDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `今日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return (
    `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

async function loadHistory() {
  if (!supa || !currentUser) return;
  historyList.innerHTML = '<li class="history-empty">読み込み中...</li>';
  try {
    const { data, error } = await supa
      .from("alarm_history")
      .select("id, alarm_time, triggered_at")
      .order("triggered_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    if (!data || data.length === 0) {
      historyList.innerHTML =
        '<li class="history-empty">まだ履歴がありません。アラームが鳴動すると自動で記録されます。</li>';
      historyCount.textContent = "0件";
      return;
    }

    historyCount.textContent = `${data.length}件`;
    historyList.innerHTML = data
      .map(
        (row) => `
          <li class="history-item">
            <span class="history-time">
              <span class="clock-icon"></span>${row.alarm_time}
            </span>
            <span class="history-meta">${formatHistoryDate(row.triggered_at)}</span>
          </li>
        `
      )
      .join("");
  } catch (e) {
    console.error(e);
    historyList.innerHTML = `<li class="history-empty">履歴の読み込みに失敗: ${e.message}</li>`;
  }
}

async function handleSignIn(e) {
  e?.preventDefault();
  if (!supa) return;
  setAuthMessage("");
  setAuthLoading(true);
  try {
    const { data, error } = await supa.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });
    if (error) throw error;
    showLoggedIn(data.user);
  } catch (e) {
    setAuthMessage(translateAuthError(e.message), "error");
  } finally {
    setAuthLoading(false);
  }
}

async function handleSignUp() {
  if (!supa) return;
  setAuthMessage("");
  if (!emailInput.value || !passwordInput.value) {
    setAuthMessage("メールとパスワードを入力してください", "error");
    return;
  }
  setAuthLoading(true);
  try {
    const { data, error } = await supa.auth.signUp({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });
    if (error) throw error;
    if (data.user && data.session) {
      showLoggedIn(data.user);
    } else {
      setAuthMessage("確認メールを送信しました。メールのリンクをクリックしてください。", "success");
    }
  } catch (e) {
    setAuthMessage(translateAuthError(e.message), "error");
  } finally {
    setAuthLoading(false);
  }
}

async function handleSignOut() {
  if (!supa) return;
  await supa.auth.signOut();
  showLoggedOut();
}

function translateAuthError(msg) {
  if (!msg) return "エラーが発生しました";
  if (/Invalid login credentials/i.test(msg))
    return "メールまたはパスワードが正しくありません";
  if (/User already registered/i.test(msg))
    return "このメールは既に登録されています";
  if (/Password should be at least/i.test(msg))
    return "パスワードは6文字以上にしてください";
  if (/Email rate limit/i.test(msg))
    return "短時間に試行が多すぎます。しばらく待ってから再度お試しください";
  return msg;
}

async function initAuth() {
  if (!isConfigured()) {
    showConfigWarn();
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase SDK not loaded");
    return;
  }
  supa = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
  );

  const { data } = await supa.auth.getSession();
  if (data.session?.user) {
    showLoggedIn(data.session.user);
  } else {
    showLoggedOut();
  }

  supa.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      showLoggedIn(session.user);
    } else {
      showLoggedOut();
    }
  });

  authForm.addEventListener("submit", handleSignIn);
  signUpBtn.addEventListener("click", handleSignUp);
  signOutBtn.addEventListener("click", handleSignOut);
}

initAuth();
