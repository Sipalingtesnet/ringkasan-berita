// lib.js — Pure helpers for Ringkasan Berita (News Digest).
// No Firebase imports here, so this module can be unit-tested in Node.
// Firebase wiring lives in app.js.

/** Articles up to this many characters are summarized with PREFER_ON_DEVICE. */
export const ON_DEVICE_THRESHOLD_CHARS = 2000;

/** UI strings. `id` is the default language; `en` is the contest-required English. */
export const I18N = {
  id: {
    appTitle: "Ringkasan Berita",
    appTagline:
      "Tempel teks berita, dapatkan ringkasan dan analisis. Ringkasan singkat berjalan di perangkatmu (Gemini Nano), teks panjang dan analisis mendalam lewat cloud (Gemini).",
    pasteLabel: "Teks berita",
    pastePlaceholder:
      "Tempel teks berita di sini (Bahasa Indonesia atau English)…\n\nContoh: berita tentang ekonomi, teknologi, olahraga, atau apa pun yang ingin kamu pahami dengan cepat.",
    lengthLabel: "Panjang ringkasan",
    lengthShort: "Singkat",
    lengthMedium: "Sedang",
    sampleBtn: "Coba contoh berita",
    clearBtn: "Bersihkan",
    summarizeBtn: "Buat Ringkasan",
    analyzeBtn: "Analisis Mendalam",
    summaryHeading: "Ringkasan",
    analysisHeading: "Analisis Mendalam",
    charCount: (n) => `${n} karakter`,
    engineOnDevice: "On-device · Gemini Nano",
    engineCloud: "Cloud · Gemini",
    engineNoteSdk: "dilaporkan SDK",
    engineNoteDetected: "terdeteksi dari ketersediaan model",
    routeOnDevice: (n) =>
      `Teks pendek (${n} karakter) — dicoba di perangkat dulu.`,
    routeCloud: (n) =>
      `Teks panjang (${n} karakter) — langsung ke cloud.`,
    analysisRoute: "Analisis mendalam selalu lewat cloud.",
    howTitle: "Bagaimana hybrid inference bekerja di aplikasi ini?",
    howBody:
      "Aplikasi ini memakai Firebase AI Logic. Untuk ringkasan, teks pendek (≤ 2.000 karakter) memakai mode PREFER_ON_DEVICE: model Gemini Nano di Chrome Desktop mencoba menjawab di perangkat — privat, gratis, dan bisa offline. Kalau perangkat tidak mendukung atau teksnya panjang, SDK otomatis beralih ke model Gemini di cloud (PREFER_IN_CLOUD). Analisis mendalam selalu memakai cloud karena butuh penalaran yang lebih berat. Badge di atas setiap hasil menunjukkan mesin mana yang benar-benar menjalankannya.",
    statusConfigured: "Firebase terhubung.",
    statusPlaceholder:
      "Mode demo: isi konfigurasi Firebase di app.js untuk mengaktifkan AI. UI tetap bisa dicoba.",
    statusAppCheckOk: "App Check aktif.",
    statusAppCheckOff: "App Check belum aktif (butuh konfigurasi Firebase).",
    onDeviceAvailable: "Model on-device: tersedia di browser ini.",
    onDeviceDownloading: "Model on-device: sedang diunduh.",
    onDeviceDownloadable: "Model on-device: bisa diunduh.",
    onDeviceUnavailable: "Model on-device: tidak tersedia — ringkasan akan lewat cloud.",
    onDeviceUnsupported:
      "Browser ini tidak mendukung model on-device (butuh Chrome Desktop 139+). Ringkasan akan lewat cloud.",
    needText: "Tempel dulu teks beritanya.",
    needConfig:
      "AI belum aktif: isi konfigurasi Firebase di app.js (lihat README), lalu muat ulang halaman.",
    summarizing: "Meringkas…",
    analyzing: "Menganalisis…",
    modelDownloading: (p) => `Mengunduh model on-device… ${p}%`,
    errorPrefix: "Terjadi kesalahan: ",
    emptyResult: "Tidak ada hasil.",
    footer:
      "#BuildHybridAI 2026 · Dibangun dengan Firebase AI Logic (hybrid inference: Gemini Nano on-device + Gemini cloud).",
  },
  en: {
    appTitle: "News Digest",
    appTagline:
      "Paste a news article and get a summary plus a deep analysis. Short summaries run on your device (Gemini Nano); long texts and deep analysis run in the cloud (Gemini).",
    pasteLabel: "News text",
    pastePlaceholder:
      "Paste the news text here (Indonesian or English)…\n\nExample: a story about the economy, technology, sports, or anything you want to understand quickly.",
    lengthLabel: "Summary length",
    lengthShort: "Short",
    lengthMedium: "Medium",
    sampleBtn: "Try a sample article",
    clearBtn: "Clear",
    summarizeBtn: "Summarize",
    analyzeBtn: "Deep Analysis",
    summaryHeading: "Summary",
    analysisHeading: "Deep Analysis",
    charCount: (n) => `${n} characters`,
    engineOnDevice: "On-device · Gemini Nano",
    engineCloud: "Cloud · Gemini",
    engineNoteSdk: "reported by the SDK",
    engineNoteDetected: "detected from model availability",
    routeOnDevice: (n) => `Short text (${n} characters) — tried on-device first.`,
    routeCloud: (n) => `Long text (${n} characters) — sent straight to the cloud.`,
    analysisRoute: "Deep analysis always runs in the cloud.",
    howTitle: "How does hybrid inference work in this app?",
    howBody:
      "This app uses Firebase AI Logic. For summaries, short texts (≤ 2,000 characters) use PREFER_ON_DEVICE mode: the Gemini Nano model in Chrome Desktop tries to answer on-device — private, free, and works offline. If the device does not support it, or the text is long, the SDK automatically falls back to a Gemini model in the cloud (PREFER_IN_CLOUD). Deep analysis always uses the cloud because it needs heavier reasoning. The badge above each result shows which engine actually ran it.",
    statusConfigured: "Firebase connected.",
    statusPlaceholder:
      "Demo mode: add your Firebase config in app.js to enable AI. The UI still works.",
    statusAppCheckOk: "App Check active.",
    statusAppCheckOff: "App Check not active (needs a Firebase config).",
    onDeviceAvailable: "On-device model: available in this browser.",
    onDeviceDownloading: "On-device model: downloading.",
    onDeviceDownloadable: "On-device model: can be downloaded.",
    onDeviceUnavailable: "On-device model: not available — summaries will run in the cloud.",
    onDeviceUnsupported:
      "This browser does not support on-device models (needs Chrome Desktop 139+). Summaries will run in the cloud.",
    needText: "Please paste the news text first.",
    needConfig:
      "AI is not active yet: add your Firebase config in app.js (see README), then reload the page.",
    summarizing: "Summarizing…",
    analyzing: "Analyzing…",
    modelDownloading: (p) => `Downloading on-device model… ${p}%`,
    errorPrefix: "Something went wrong: ",
    emptyResult: "No result.",
    footer:
      "#BuildHybridAI 2026 · Built with Firebase AI Logic (hybrid inference: on-device Gemini Nano + cloud Gemini).",
  },
};

/** Look up a UI string. Falls back to English, then to the key itself. */
export function t(lang, key) {
  const table = I18N[lang] || I18N.en;
  const value = table[key];
  if (value !== undefined) return value;
  const fallback = I18N.en[key];
  return fallback !== undefined ? fallback : key;
}

/**
 * Choose the summary inference mode from the article length.
 * Short text -> PREFER_ON_DEVICE (try Gemini Nano first, cloud fallback).
 * Long text  -> PREFER_IN_CLOUD (cloud first; on-device only as offline fallback).
 */
export function chooseSummaryMode(text) {
  const len = (text || "").trim().length;
  return len <= ON_DEVICE_THRESHOLD_CHARS
    ? "PREFER_ON_DEVICE"
    : "PREFER_IN_CLOUD";
}

/** Build the single-turn summarization prompt. On-device only supports single-turn text. */
export function buildSummaryPrompt(text, length, lang) {
  const article = (text || "").trim();
  if (lang === "en") {
    const size =
      length === "medium"
        ? "Medium length: two short paragraphs, about 200–300 words."
        : "Short: 3–4 sentences, at most about 120 words.";
    return (
      `Summarize the news article below in English. ${size}\n` +
      `Write a concise, neutral summary based only on the given text. ` +
      `Do not add facts that are not in the text.\n\nNews article:\n\n${article}`
    );
  }
  const size =
    length === "medium"
      ? "Panjang sedang: dua paragraf pendek, sekitar 200–300 kata."
      : "Singkat: 3–4 kalimat, maksimal sekitar 120 kata.";
  return (
    `Ringkas berita berikut dalam bahasa Indonesia. ${size}\n` +
    `Tulis ringkasan yang padat dan netral, hanya berdasarkan teks yang diberikan. ` +
    `Jangan menambahkan fakta yang tidak ada di teks.\n\nTeks berita:\n\n${article}`
  );
}

/** Build the single-turn deep-analysis prompt. Always routed to the cloud. */
export function buildAnalysisPrompt(text, lang) {
  const article = (text || "").trim();
  if (lang === "en") {
    return (
      `Analyze the news article below in depth, in English. Answer with exactly this structure:\n` +
      `1. Key claims — a bullet list of the most important claims made in the article.\n` +
      `2. Context & background — context that helps a reader understand this story.\n` +
      `3. What is missing or uncertain — things the article does not mention, leaves ambiguous, or that still need verification.\n` +
      `Base everything on the given text. Clearly mark anything that is not stated in the text.\n\nNews article:\n\n${article}`
    );
  }
  return (
    `Analisis berita berikut secara mendalam dalam bahasa Indonesia. Jawab dengan struktur berikut:\n` +
    `1. Klaim utama — daftar poin-poin klaim terpenting dari berita ini.\n` +
    `2. Konteks & latar belakang — konteks yang membantu pembaca memahami berita ini.\n` +
    `3. Yang belum jelas / perlu diverifikasi — hal-hal yang tidak disebutkan dalam berita, ambigu, atau masih perlu dicek kebenarannya.\n` +
    `Tulis berdasarkan teks yang diberikan. Tandai dengan jelas jika ada informasi yang tidak ada di teks.\n\nTeks berita:\n\n${article}`
  );
}

/** Escape HTML so model output can never inject markup. */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Apply **bold** markers inside one already-escaped line. */
function boldize(line) {
  return line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/**
 * Render model plain-text output as safe HTML.
 * "- " lines become a bullet list; other non-empty lines become paragraphs.
 */
export function renderRichText(text) {
  const lines = String(text || "").split(/\r?\n/);
  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${boldize(escapeHtml(line.slice(2).trim()))}</li>`;
    } else {
      closeList();
      html += `<p>${boldize(escapeHtml(line))}</p>`;
    }
  }
  closeList();
  return html || `<p>${escapeHtml("")}</p>`;
}

/** Sample articles for the "Try a sample" button (short enough to route on-device). */
export const SAMPLES = {
  id: `Pemerintah Kota Bandung mengumumkan program bus listrik gratis untuk pelajar mulai Januari 2027. Sebanyak 40 unit bus akan melayani 12 rute yang melewati kawasan sekolah dan kampus, beroperasi pukul 05.30 hingga 19.00 setiap hari kerja. Wali Kota mengatakan program ini dibiayai dari APBD sebesar Rp48 miliar pada tahun pertama, dan ditargetkan mengurangi kemacetan di jam berangkat sekolah hingga 15 persen. Dinas Perhubungan menambahkan, pelajar cukup menunjukkan kartu pelajar untuk naik, sementara masyarakat umum tetap membayar tarif normal Rp4.000. Tahap uji coba akan dilakukan selama Desember 2026 di tiga rute, dengan evaluasi tiap dua minggu.`,
  en: `The city of Bandung has announced a free electric bus program for students starting in January 2027. Forty buses will serve 12 routes passing school and university areas, running from 5:30 a.m. to 7:00 p.m. on weekdays. The mayor said the program is funded with Rp48 billion from the city budget in its first year and is expected to cut school-hour congestion by up to 15 percent. The transport agency added that students only need to show a student card to ride, while the general public still pays the normal fare of Rp4,000. A trial will run throughout December 2026 on three routes, with an evaluation every two weeks.`,
};
