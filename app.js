"use strict";

const STORAGE_KEY = "biharkalyan.studyAmbient.v1";
const SOUND_NAMES = ["rain", "forest", "fan", "wind", "white"];
const THEMES = [
  { id: "midnight", name: "Midnight", swatch: "#101b28" },
  { id: "paper", name: "Warm Paper", swatch: "#f4f0e9" },
  { id: "forest", name: "Forest", swatch: "#173b31" },
  { id: "lavender", name: "Lavender", swatch: "#cdd3ef" },
  { id: "ocean", name: "Ocean", swatch: "#164450" },
  { id: "sunrise", name: "Sunrise", swatch: "#fff0e7" },
  { id: "slate", name: "Soft Slate", swatch: "#253340" },
  { id: "sage", name: "Sage", swatch: "#e5eee7" },
  { id: "dusk", name: "Dusk", swatch: "#43344b" },
  { id: "blue", name: "Daylight", swatch: "#b8d7eb" }
];

const defaults = {
  theme: "midnight",
  master: 70,
  active: { rain: true, forest: true, fan: false, wind: false, white: false },
  volumes: { rain: 55, forest: 45, fan: 40, wind: 45, white: 30 },
  sleepMinutes: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function validPercentage(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(clamp(number, 0, 100)) : fallback;
}
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const theme = THEMES.some(item => item.id === saved.theme) ? saved.theme : defaults.theme;
    const active = {};
    const volumes = {};
    for (const name of SOUND_NAMES) {
      active[name] = typeof saved.active?.[name] === "boolean" ? saved.active[name] : defaults.active[name];
      volumes[name] = validPercentage(saved.volumes?.[name], defaults.volumes[name]);
    }
    const sleep = Number(saved.sleepMinutes);
    return {
      theme, active, volumes,
      master: validPercentage(saved.master, defaults.master),
      sleepMinutes: Number.isInteger(sleep) && sleep >= 0 && sleep <= 720 ? sleep : 0
    };
  } catch {
    return structuredClone(defaults);
  }
}
let settings = loadSettings();
function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
  catch { /* The app works without localStorage. */ }
}

const elements = {
  settingsButton: document.getElementById("settingsButton"),
  closeSettings: document.getElementById("closeSettings"),
  settingsPanel: document.getElementById("settingsPanel"),
  backdrop: document.getElementById("backdrop"),
  fullscreenButton: document.getElementById("fullscreenButton"),
  fullscreenIcon: document.getElementById("fullscreenIcon"),
  playButton: document.getElementById("playButton"),
  playLabel: document.getElementById("playLabel"),
  playSymbol: document.getElementById("playSymbol"),
  stopButton: document.getElementById("stopButton"),
  playStatus: document.getElementById("playStatus"),
  activeCount: document.getElementById("activeCount"),
  visualizer: document.getElementById("visualizer"),
  masterVolume: document.getElementById("masterVolume"),
  masterValue: document.getElementById("masterValue"),
  themeGrid: document.getElementById("themeGrid"),
  timerPresets: document.getElementById("timerPresets"),
  timerFeedback: document.getElementById("timerFeedback"),
  customTimer: document.getElementById("customTimer"),
  setCustomTimer: document.getElementById("setCustomTimer")
};

// Web Audio produces original, continuous ambient textures entirely in the browser.
// There are no audio downloads, external media, or third-party services.
class AmbientEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.soundGains = new Map();
    this.playing = false;
    this.birdInterval = null;
  }

  noiseBuffer(kind = "white") {
    const context = this.context;
    const length = context.sampleRate * 6;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let brown = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let index = 0; index < length; index++) {
      const white = Math.random() * 2 - 1;
      if (kind === "brown") {
        brown = (brown + .02 * white) / 1.02;
        samples[index] = brown * 3.5;
      } else if (kind === "pink") {
        b0 = .99886 * b0 + white * .0555179;
        b1 = .99332 * b1 + white * .0750759;
        b2 = .969 * b2 + white * .153852;
        b3 = .8665 * b3 + white * .3104856;
        b4 = .55 * b4 + white * .5329522;
        b5 = -.7616 * b5 - white * .016898;
        samples[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * .5362) * .12;
        b6 = white * .115926;
      } else {
        samples[index] = white * .55;
      }
    }
    return buffer;
  }

  makeSource(buffer, destination) {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(destination);
    source.start();
    return source;
  }

  filteredNoise(kind, filterType, frequency, destination, quality = .6) {
    const filter = this.context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = quality;
    filter.connect(destination);
    this.makeSource(this.noiseBuffer(kind), filter);
    return filter;
  }

  build() {
    if (this.context) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error("Your browser does not support Web Audio.");
    this.context = new Context();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = settings.master / 100 * .72;
    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -15;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    this.masterGain.connect(compressor);
    compressor.connect(this.context.destination);

    for (const name of SOUND_NAMES) {
      const gain = this.context.createGain();
      gain.gain.value = 0;
      gain.connect(this.masterGain);
      this.soundGains.set(name, gain);
    }
    this.filteredNoise("pink", "highpass", 450, this.soundGains.get("rain"));
    this.filteredNoise("pink", "lowpass", 2200, this.soundGains.get("forest"));
    this.filteredNoise("brown", "lowpass", 650, this.soundGains.get("fan"));
    this.filteredNoise("pink", "lowpass", 470, this.soundGains.get("wind"));
    this.makeSource(this.noiseBuffer("white"), this.soundGains.get("white"));

    // Subtle fan motor fundamental.
    const hum = this.context.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 75;
    const humGain = this.context.createGain();
    humGain.gain.value = .055;
    hum.connect(humGain);
    humGain.connect(this.soundGains.get("fan"));
    hum.start();

    // Slow wind swells.
    const windGain = this.soundGains.get("wind");
    const lfo = this.context.createOscillator();
    lfo.frequency.value = .13;
    const depth = this.context.createGain();
    depth.gain.value = .12;
    lfo.connect(depth);
    depth.connect(windGain.gain);
    lfo.start();
    this.updateLevels();
  }

  updateLevels() {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const name of SOUND_NAMES) {
      const gain = this.soundGains.get(name);
      const target = settings.active[name] ? settings.volumes[name] / 100 * .52 : 0;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(target, now, .08);
    }
    this.masterGain.gain.setTargetAtTime(settings.master / 100 * .72, now, .08);
  }

  chirp() {
    if (!this.playing || !settings.active.forest || !this.context || this.context.state !== "running") return;
    const now = this.context.currentTime;
    const notes = [780, 1020, 1260, 1470];
    const frequency = notes[Math.floor(Math.random() * notes.length)];
    for (let index = 0; index < 2; index++) {
      const start = now + index * .15;
      const osc = this.context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, start);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.28, start + .1);
      const envelope = this.context.createGain();
      envelope.gain.setValueAtTime(.0001, start);
      envelope.gain.exponentialRampToValueAtTime(.12, start + .025);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + .17);
      osc.connect(envelope);
      envelope.connect(this.soundGains.get("forest"));
      osc.start(start);
      osc.stop(start + .18);
    }
  }

  async play() {
    this.build();
    this.updateLevels();
    await this.context.resume();
    this.playing = true;
    if (!this.birdInterval) this.birdInterval = setInterval(() => this.chirp(), 3400);
    this.chirp();
  }

  async stop() {
    this.playing = false;
    if (this.birdInterval) clearInterval(this.birdInterval);
    this.birdInterval = null;
    if (this.context && this.context.state === "running") {
      await this.context.suspend();
    }
  }
}
const engine = new AmbientEngine();
let playing = false;
let sleepRemainingMs = settings.sleepMinutes * 60000;
let sleepEndAt = 0;
let sleepInterval = null;

function activeNames() { return SOUND_NAMES.filter(name => settings.active[name]); }
function renderSoundCards() {
  for (const name of SOUND_NAMES) {
    const card = document.querySelector(`[data-sound="${name}"]`);
    const toggle = document.querySelector(`[data-toggle="${name}"]`);
    const volume = document.querySelector(`[data-volume="${name}"]`);
    card.classList.toggle("active", settings.active[name]);
    toggle.setAttribute("aria-pressed", String(settings.active[name]));
    volume.value = String(settings.volumes[name]);
    document.getElementById(`value-${name}`).textContent = settings.volumes[name] + "%";
  }
  const count = activeNames().length;
  elements.activeCount.textContent = count ? `${count} sound${count === 1 ? "" : "s"} selected` : "No sounds selected";
}
function renderPlayback() {
  elements.playLabel.textContent = playing ? "Pause sounds" : "Play sounds";
  elements.playSymbol.textContent = playing ? "Ⅱ" : "▶";
  elements.playButton.setAttribute("aria-label", playing ? "Pause sounds" : "Play sounds");
  elements.playStatus.classList.toggle("playing", playing);
  elements.playStatus.lastChild.textContent = playing ? " Sounds are playing" : " Ready when you are";
  elements.visualizer.classList.toggle("active", playing);
}
function updateSleepDisplay() {
  if (!settings.sleepMinutes) {
    elements.timerFeedback.textContent = "Sleep timer is off";
    return;
  }
  const ms = playing ? Math.max(0, sleepEndAt - Date.now()) : sleepRemainingMs;
  const totalSeconds = Math.ceil(ms / 1000);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  elements.timerFeedback.textContent = `Stops in ${mm}:${String(ss).padStart(2, "0")}${playing ? "" : " (paused)"}`;
}
function resetSleepInterval() {
  if (sleepInterval !== null) clearInterval(sleepInterval);
  sleepInterval = null;
  if (!playing || !settings.sleepMinutes) return;
  sleepEndAt = Date.now() + sleepRemainingMs;
  sleepInterval = setInterval(() => {
    if (Date.now() >= sleepEndAt) {
      stopPlayback(true);
    } else {
      updateSleepDisplay();
    }
  }, 250);
}
function setSleepTimer(minutes) {
  settings.sleepMinutes = minutes;
  sleepRemainingMs = minutes * 60000;
  saveSettings();
  document.querySelectorAll("[data-time]").forEach(button => {
    button.classList.toggle("selected", Number(button.dataset.time) === minutes);
  });
  resetSleepInterval();
  updateSleepDisplay();
}
async function startPlayback() {
  if (!activeNames().length) settings.active.rain = true;
  renderSoundCards();
  saveSettings();
  try {
    await engine.play();
    playing = true;
    renderPlayback();
    resetSleepInterval();
    updateSleepDisplay();
  } catch (error) {
    playing = false;
    renderPlayback();
    elements.playStatus.lastChild.textContent = ` ${error.message || "Unable to start audio"}`;
  }
}
async function stopPlayback(expired = false) {
  if (playing && settings.sleepMinutes && !expired) {
    sleepRemainingMs = Math.max(0, sleepEndAt - Date.now());
  }
  playing = false;
  renderPlayback();
  if (sleepInterval !== null) clearInterval(sleepInterval);
  sleepInterval = null;
  if (expired) {
    settings.sleepMinutes = 0;
    sleepRemainingMs = 0;
    saveSettings();
    document.querySelectorAll("[data-time]").forEach(button => {
      button.classList.toggle("selected", button.dataset.time === "0");
    });
    elements.playStatus.lastChild.textContent = " Sleep timer completed";
  }
  updateSleepDisplay();
  try { await engine.stop(); }
  catch (error) { console.warn("Unable to stop audio:", error); }
}

for (const name of SOUND_NAMES) {
  document.querySelector(`[data-toggle="${name}"]`).addEventListener("click", () => {
    settings.active[name] = !settings.active[name];
    saveSettings();
    renderSoundCards();
    engine.updateLevels();
  });
  document.querySelector(`[data-volume="${name}"]`).addEventListener("input", event => {
    settings.volumes[name] = validPercentage(event.target.value, 50);
    saveSettings();
    document.getElementById(`value-${name}`).textContent = settings.volumes[name] + "%";
    engine.updateLevels();
  });
}
elements.masterVolume.value = String(settings.master);
elements.masterValue.textContent = settings.master + "%";
elements.masterVolume.addEventListener("input", event => {
  settings.master = validPercentage(event.target.value, 70);
  elements.masterValue.textContent = settings.master + "%";
  saveSettings();
  engine.updateLevels();
});
elements.playButton.addEventListener("click", () => playing ? stopPlayback() : startPlayback());
elements.stopButton.addEventListener("click", () => stopPlayback());

// Theme preferences.
function setTheme(theme) {
  if (!THEMES.some(item => item.id === theme)) return;
  settings.theme = theme;
  document.body.dataset.theme = theme;
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    const selected = button.dataset.themeChoice === theme;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  saveSettings();
}
for (const theme of THEMES) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-button";
  button.dataset.themeChoice = theme.id;
  const swatch = document.createElement("span");
  swatch.className = "theme-swatch";
  swatch.style.background = theme.swatch;
  button.append(swatch, document.createTextNode(theme.name));
  button.addEventListener("click", () => setTheme(theme.id));
  elements.themeGrid.appendChild(button);
}
setTheme(settings.theme);

// Sleep timer.
for (const button of elements.timerPresets.querySelectorAll("button")) {
  button.addEventListener("click", () => setSleepTimer(Number(button.dataset.time)));
}
function setCustomMinutes() {
  const minutes = Number(elements.customTimer.value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) {
    elements.customTimer.setCustomValidity("Choose a whole number from 1 to 720.");
    elements.customTimer.reportValidity();
    return;
  }
  elements.customTimer.setCustomValidity("");
  setSleepTimer(minutes);
}
elements.setCustomTimer.addEventListener("click", setCustomMinutes);
elements.customTimer.addEventListener("input", () => elements.customTimer.setCustomValidity(""));
elements.customTimer.addEventListener("keydown", event => {
  if (event.key === "Enter") setCustomMinutes();
});
setSleepTimer(settings.sleepMinutes);

// Drawer.
function openSettings() {
  elements.settingsPanel.classList.add("open");
  elements.backdrop.classList.add("visible");
  elements.settingsPanel.setAttribute("aria-hidden", "false");
  elements.settingsButton.setAttribute("aria-expanded", "true");
  elements.closeSettings.focus();
}
function closeSettings() {
  if (elements.settingsPanel.contains(document.activeElement)) elements.settingsButton.focus();
  elements.settingsPanel.classList.remove("open");
  elements.backdrop.classList.remove("visible");
  elements.settingsPanel.setAttribute("aria-hidden", "true");
  elements.settingsButton.setAttribute("aria-expanded", "false");
}
elements.settingsButton.addEventListener("click", openSettings);
elements.closeSettings.addEventListener("click", closeSettings);
elements.backdrop.addEventListener("click", closeSettings);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeSettings(); });

// Browser fullscreen is optional (some mobile browsers do not support the API).
const expandSVG = '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>';
const exitSVG = '<path d="M5 5 19 19M19 5 5 19"/>';
elements.fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch (error) { console.warn("Fullscreen unavailable:", error); }
});
document.addEventListener("fullscreenchange", () => {
  const fullscreen = Boolean(document.fullscreenElement);
  elements.fullscreenIcon.innerHTML = fullscreen ? exitSVG : expandSVG;
  const label = fullscreen ? "Exit fullscreen" : "Enter fullscreen";
  elements.fullscreenButton.setAttribute("aria-label", label);
  elements.fullscreenButton.title = label;
});

renderSoundCards();
renderPlayback();
updateSleepDisplay();
