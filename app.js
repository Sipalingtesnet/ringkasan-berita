// app.js — Ringkasan Berita (News Digest).
// Firebase AI Logic wiring + UI. Pure helpers live in lib.js.
//
// SETUP (do this once, before the demo/submission):
//   1. Create a Firebase project, enable AI Logic (Gemini Developer API),
//      and copy the web app config below.
//   2. Replace RECAPTCHA_ENTERPRISE_SITE_KEY with your reCAPTCHA Enterprise
//      site key (App Check), or keep the debug token flow for local testing:
//      the browser console prints an App Check debug token — safelist it in
//      Firebase console > App Check > Manage debug tokens.

import { initializeApp } from "firebase/app";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "firebase/ai";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import {
  I18N,
  t,
  chooseSummaryMode,
  buildSummaryPrompt,
  buildAnalysisPrompt,
  renderRichText,
  SAMPLES,
} from "./lib.js";

// ---------------------------------------------------------------------------
// Firebase config — REAL project "ringkasan-berita" (created 18 Nov 2026,
// account nurkhalifa443@gmail.com, free Spark plan, AI Logic + Gemini
// Developer API backend). Firebase console > Project settings > Your apps.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCDSJLLdjeAEC2tTPCyrI0bPCUwb29G45A",
  authDomain: "ringkasan-berita.firebaseapp.com",
  projectId: "ringkasan-berita",
  storageBucket: "ringkasan-berita.firebasestorage.app",
  messagingSenderId: "311290769793",
  appId: "1:311290769793:web:efddb1e26a4ecb466fb880",
};

// reCAPTCHA Enterprise site key for App Check — REAL key, created 18 Nov
// 2026 (score-based, domain ringkasan-berita.web.app). The debug-token flow
// below still applies while developing locally.
const RECAPTCHA_ENTERPRISE_SITE_KEY = "6LevzyYuAAAAAMFKIGmEMvVDcjPvcF_6uH9Lfbtk";

const isConfigured = !String(firebaseConfig.apiKey || "").startsWith("YOUR_");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let lang = "id";
let summaryLength = "short";
let firebaseApp = null;
let ai = null;
let modelOnDevice = null; // PREFER_ON_DEVICE
let modelCloud = null; // PREFER_IN_CLOUD
let appCheckOk = false;
let onDeviceStatus = "unknown"; // available | downloading | downloadable | unavailable | unsupported

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = t(lang, el.dataset.i18n);
    if (typeof value === "string") el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const value = t(lang, el.dataset.i18nPlaceholder);
    if (typeof value === "string") el.placeholder = value;
  });
  $("lang-id").setAttribute("aria-pressed", String(lang === "id"));
  $("lang-en").setAttribute("aria-pressed", String(lang === "en"));
  $("len-short").setAttribute("aria-pressed", String(summaryLength === "short"));
  $("len-medium").setAttribute("aria-pressed", String(summaryLength === "medium"));
  updateCharCount();
}

function updateCharCount() {
  const n = $("article").value.length;
  $("char-count").textContent = t(lang, "charCount")(n);
}

function setStatus(text, warn = false) {
  $("status-text").textContent = text;
  $("status-dot").classList.toggle("warn", warn);
}

function showBanner(html) {
  const banner = $("config-banner");
  banner.innerHTML = html;
  banner.hidden = false;
}

function setBusy(busy) {
  $("btn-summarize").disabled = busy || !isConfigured;
  $("btn-analyze").disabled = busy || !isConfigured;
}

// ---------------------------------------------------------------------------
// Firebase init (only when a real config is present)
// ---------------------------------------------------------------------------
function initFirebase() {
  if (!isConfigured) return;
  try {
    firebaseApp = initializeApp(firebaseConfig);

    // App Check (enforced for AI Logic). Debug-token flow for local/dev use:
    // the console prints a debug token — safelist it in the Firebase console.
    try {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaEnterpriseProvider(
          RECAPTCHA_ENTERPRISE_SITE_KEY,
        ),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckOk = true;
    } catch (e) {
      console.warn("App Check init failed:", e);
      appCheckOk = false;
    }

    // Gemini Developer API backend (free tier, no billing needed for text).
    ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
    modelOnDevice = getGenerativeModel(ai, {
      model: "gemini-2.0-flash",
      mode: InferenceMode.PREFER_ON_DEVICE,
    });
    modelCloud = getGenerativeModel(ai, {
      model: "gemini-2.0-flash",
      mode: InferenceMode.PREFER_IN_CLOUD,
    });
  } catch (e) {
    console.error("Firebase init failed:", e);
    firebaseApp = null;
    ai = null;
  }
}

// ---------------------------------------------------------------------------
// On-device availability probe (Chrome Prompt API). Read-only check.
// ---------------------------------------------------------------------------
async function probeOnDevice() {
  if (!("LanguageModel" in window)) {
    onDeviceStatus = "unsupported";
    return;
  }
  try {
    const availability = await window.LanguageModel.availability();
    onDeviceStatus = availability; // available | downloading | downloadable | unavailable
  } catch (e) {
    onDeviceStatus = "unsupported";
  }
}

function onDeviceStatusText() {
  switch (onDeviceStatus) {
    case "available":
      return t(lang, "onDeviceAvailable");
    case "downloading":
      return t(lang, "onDeviceDownloading");
    case "downloadable":
      return t(lang, "onDeviceDownloadable");
    case "unavailable":
      return t(lang, "onDeviceUnavailable");
    default:
      return t(lang, "onDeviceUnsupported");
  }
}

function refreshStatusLine() {
  const parts = [];
  parts.push(
    isConfigured ? t(lang, "statusConfigured") : t(lang, "statusPlaceholder"),
  );
  if (isConfigured) {
    parts.push(
      appCheckOk ? t(lang, "statusAppCheckOk") : t(lang, "statusAppCheckOff"),
    );
  }
  parts.push(onDeviceStatusText());
  setStatus(parts.join(" "), !isConfigured);
}

// ---------------------------------------------------------------------------
// Engine badge: which engine actually ran the request.
// Primary source: response.inferenceSource ("ON_DEVICE" | "IN_CLOUD").
// Fallback: the on-device availability probe done before the call.
// ---------------------------------------------------------------------------
function engineBadge(source, mode) {
  let engine = null;
  let note = "";
  if (source === "ON_DEVICE" || source === "IN_CLOUD") {
    engine = source;
    note = t(lang, "engineNoteSdk");
  } else if (mode === "PREFER_ON_DEVICE") {
    engine = onDeviceStatus === "available" ? "ON_DEVICE" : "IN_CLOUD";
    note = t(lang, "engineNoteDetected");
  } else {
    engine = "IN_CLOUD";
    note = t(lang, "engineNoteDetected");
  }
  return { engine, note };
}

function renderBadge(badgeEl, engine) {
  badgeEl.textContent =
    engine === "ON_DEVICE"
      ? t(lang, "engineOnDevice")
      : t(lang, "engineCloud");
  badgeEl.className =
    "badge " + (engine === "ON_DEVICE" ? "on-device" : "cloud");
}

function renderBanner() {
  if (isConfigured) return;
  showBanner(
    `<strong>${t(lang, "statusPlaceholder")}</strong><br>` +
      `1. Create a Firebase project and enable AI Logic (Gemini Developer API).<br>` +
      `2. Paste the web app config into <code>firebaseConfig</code> in <code>app.js</code>.<br>` +
      `3. Replace <code>RECAPTCHA_ENTERPRISE_SITE_KEY</code> and safelist the App Check debug token shown in the console. See README.md.`,
  );
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
async function runSummary() {
  const text = $("article").value.trim();
  if (!text) {
    setStatus(t(lang, "needText"), true);
    return;
  }
  if (!isConfigured) {
    setStatus(t(lang, "needConfig"), true);
    return;
  }
  const mode = chooseSummaryMode(text);
  const model = mode === "PREFER_ON_DEVICE" ? modelOnDevice : modelCloud;
  if (!model) {
    setStatus(t(lang, "needConfig"), true);
    return;
  }
  const prompt = buildSummaryPrompt(text, summaryLength, lang);

  setBusy(true);
  $("summary-card").hidden = false;
  $("summary-output").innerHTML = `<p class="spinner">${t(lang, "summarizing")}</p>`;
  $("summary-badge").textContent = "";
  $("summary-route").textContent =
    mode === "PREFER_ON_DEVICE"
      ? t(lang, "routeOnDevice")(text.length)
      : t(lang, "routeCloud")(text.length);

  try {
    // initializeDeviceModel() must run on/after a user gesture and before
    // the first on-device request. Fire-and-forget: PREFER_ON_DEVICE falls
    // back to the cloud while the model downloads.
    if (
      mode === "PREFER_ON_DEVICE" &&
      model &&
      typeof model.initializeDeviceModel === "function"
    ) {
      model.initializeDeviceModel((progress) => {
        setStatus(t(lang, "modelDownloading")(Math.round(progress * 100)));
      });
    }
    const result = await model.generateContent(prompt);
    const response = result.response;
    const output = response.text();
    const { engine, note } = engineBadge(response.inferenceSource, mode);
    renderBadge($("summary-badge"), engine);
    // Keep the routing reason, append how the engine was determined.
    $("summary-route").textContent =
      (mode === "PREFER_ON_DEVICE"
        ? t(lang, "routeOnDevice")(text.length)
        : t(lang, "routeCloud")(text.length)) + ` (${note})`;
    $("summary-output").innerHTML = renderRichText(output || t(lang, "emptyResult"));
    refreshStatusLine();
  } catch (e) {
    console.error("Summary failed:", e);
    $("summary-output").innerHTML = `<p>${t(lang, "errorPrefix")}${e.message || e}</p>`;
  } finally {
    setBusy(false);
  }
}

async function runAnalysis() {
  const text = $("article").value.trim();
  if (!text) {
    setStatus(t(lang, "needText"), true);
    return;
  }
  if (!isConfigured) {
    setStatus(t(lang, "needConfig"), true);
    return;
  }
  if (!modelCloud) {
    setStatus(t(lang, "needConfig"), true);
    return;
  }
  const prompt = buildAnalysisPrompt(text, lang);

  setBusy(true);
  $("analysis-card").hidden = false;
  $("analysis-output").innerHTML = `<p class="spinner">${t(lang, "analyzing")}</p>`;
  $("analysis-route").textContent = t(lang, "analysisRoute");

  try {
    const result = await modelCloud.generateContent(prompt);
    const response = result.response;
    const output = response.text();
    const { engine, note } = engineBadge(response.inferenceSource, "PREFER_IN_CLOUD");
    renderBadge($("analysis-badge"), engine);
    $("analysis-route").textContent =
      `${t(lang, "analysisRoute")} (${note})`;
    $("analysis-output").innerHTML = renderRichText(output || t(lang, "emptyResult"));
    refreshStatusLine();
  } catch (e) {
    console.error("Analysis failed:", e);
    $("analysis-output").innerHTML = `<p>${t(lang, "errorPrefix")}${e.message || e}</p>`;
  } finally {
    setBusy(false);
  }
}

// ---------------------------------------------------------------------------
// Wire up UI
// ---------------------------------------------------------------------------
$("lang-id").addEventListener("click", () => {
  lang = "id";
  applyI18n();
  renderBanner();
  refreshStatusLine();
});
$("lang-en").addEventListener("click", () => {
  lang = "en";
  applyI18n();
  renderBanner();
  refreshStatusLine();
});
$("len-short").addEventListener("click", () => {
  summaryLength = "short";
  applyI18n();
});
$("len-medium").addEventListener("click", () => {
  summaryLength = "medium";
  applyI18n();
});
$("article").addEventListener("input", updateCharCount);
$("btn-sample").addEventListener("click", () => {
  $("article").value = SAMPLES[lang];
  updateCharCount();
  $("article").focus();
});
$("btn-clear").addEventListener("click", () => {
  $("article").value = "";
  $("summary-card").hidden = true;
  $("analysis-card").hidden = true;
  updateCharCount();
  $("article").focus();
});
$("btn-summarize").addEventListener("click", runSummary);
$("btn-analyze").addEventListener("click", runAnalysis);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
initFirebase();
applyI18n();
renderBanner();
setBusy(false);
refreshStatusLine();
probeOnDevice().then(refreshStatusLine);
