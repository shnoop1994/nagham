import { MAQAMAT, buildKeys } from "./maqamat.js";
import { ensureAudio, playTone, stopTone, stopAll } from "./audio.js";

const homeView = document.getElementById("home");
const pianoView = document.getElementById("piano");
const keyboardEl = document.getElementById("keyboard");
const maqamTitle = document.getElementById("maqam-title");
const noteReadout = document.getElementById("note-readout");
const backBtn = document.getElementById("back-btn");

let currentSection = "free";
let keys = [];
const pointerToKey = new Map();

function showHome() {
  stopAll();
  pointerToKey.clear();
  pianoView.classList.remove("is-active");
  pianoView.hidden = true;
  homeView.hidden = false;
  // Force reflow for transition
  void homeView.offsetWidth;
  homeView.classList.add("is-active");
  noteReadout.textContent = "—";
}

function showPiano(sectionId) {
  currentSection = sectionId;
  const maqam = MAQAMAT[sectionId] || MAQAMAT.free;
  maqamTitle.textContent = maqam.title;

  homeView.classList.remove("is-active");
  homeView.hidden = true;
  pianoView.hidden = false;
  void pianoView.offsetWidth;
  pianoView.classList.add("is-active");

  ensureAudio();
  renderKeyboard(sectionId);
}

function renderKeyboard(sectionId) {
  keys = buildKeys(sectionId);
  keyboardEl.innerHTML = "";

  const frag = document.createDocumentFragment();
  for (const key of keys) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `key key-${key.kind}${key.isTonic ? " is-tonic" : ""}${key.inScale ? "" : " is-out"}`;
    btn.dataset.keyId = key.id;
    btn.setAttribute("aria-label", key.label);
    btn.innerHTML = `<span class="key-label">${key.label}</span><span class="key-sub">${key.sub}</span>`;
    frag.appendChild(btn);
  }
  keyboardEl.appendChild(frag);
}

function findKey(id) {
  return keys.find((k) => k.id === id);
}

function pressKey(id, pointerId) {
  const key = findKey(id);
  if (!key) return;
  const el = keyboardEl.querySelector(`[data-key-id="${id}"]`);
  if (!el || el.classList.contains("is-active")) {
    if (pointerId != null) pointerToKey.set(pointerId, id);
    return;
  }
  el.classList.add("is-active");
  playTone(id, key.hz);
  noteReadout.textContent = key.label;
  if (pointerId != null) pointerToKey.set(pointerId, id);
}

function releaseKey(id) {
  const el = keyboardEl.querySelector(`[data-key-id="${id}"]`);
  if (el) el.classList.remove("is-active");
  stopTone(id);
}

function keyIdFromEventTarget(target) {
  const el = target?.closest?.("[data-key-id]");
  return el?.dataset?.keyId ?? null;
}

function onPointerDown(e) {
  if (e.button != null && e.button !== 0) return;
  const id = keyIdFromEventTarget(e.target);
  if (!id) return;
  e.preventDefault();
  keyboardEl.setPointerCapture?.(e.pointerId);
  ensureAudio();
  pressKey(id, e.pointerId);
}

function onPointerMove(e) {
  if (!pointerToKey.has(e.pointerId)) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const nextId = keyIdFromEventTarget(el);
  const prevId = pointerToKey.get(e.pointerId);
  if (!nextId || nextId === prevId) return;
  releaseKey(prevId);
  pressKey(nextId, e.pointerId);
}

function onPointerUp(e) {
  const id = pointerToKey.get(e.pointerId);
  if (id) {
    releaseKey(id);
    pointerToKey.delete(e.pointerId);
  }
  try {
    keyboardEl.releasePointerCapture?.(e.pointerId);
  } catch {
    /* ignore */
  }
}

function bindUI() {
  document.querySelectorAll("[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      showPiano(btn.dataset.section);
    });
  });

  backBtn.addEventListener("click", showHome);

  keyboardEl.addEventListener("pointerdown", onPointerDown);
  keyboardEl.addEventListener("pointermove", onPointerMove);
  keyboardEl.addEventListener("pointerup", onPointerUp);
  keyboardEl.addEventListener("pointercancel", onPointerUp);
  keyboardEl.addEventListener("lostpointercapture", onPointerUp);

  // Computer keyboard: map row of keys for practice
  const computerMap = "قورتثذدجحخهعغفقثصضشسيبلاتنمكةظزوةى";
  window.addEventListener("keydown", (e) => {
    if (pianoView.hidden || e.repeat) return;
    const idx = computerMap.indexOf(e.key);
    if (idx < 0 || idx >= keys.length) return;
    e.preventDefault();
    pressKey(keys[idx].id, `kb-${idx}`);
  });
  window.addEventListener("keyup", (e) => {
    const idx = computerMap.indexOf(e.key);
    if (idx < 0 || idx >= keys.length) return;
    releaseKey(keys[idx].id);
    pointerToKey.delete(`kb-${idx}`);
  });

  window.addEventListener("blur", () => {
    stopAll();
    pointerToKey.clear();
    keyboardEl.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
  });
}

bindUI();
