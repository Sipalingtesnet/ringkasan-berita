// test-lib.mjs — Node tests for lib.js (pure helpers, no Firebase).
// Run: node test-lib.mjs
import assert from "node:assert/strict";
import {
  ON_DEVICE_THRESHOLD_CHARS,
  t,
  chooseSummaryMode,
  buildSummaryPrompt,
  buildAnalysisPrompt,
  escapeHtml,
  renderRichText,
  SAMPLES,
} from "./lib.js";

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
};

// i18n
ok("t() returns Indonesian strings by default", () => {
  assert.equal(t("id", "summarizeBtn"), "Buat Ringkasan");
  assert.equal(t("en", "summarizeBtn"), "Summarize");
});
ok("t() falls back to English for unknown languages", () => {
  assert.equal(t("xx", "summarizeBtn"), "Summarize");
});
ok("t() returns the key when missing everywhere", () => {
  assert.equal(t("id", "noSuchKey"), "noSuchKey");
});
ok("charCount is a function per language", () => {
  assert.equal(t("id", "charCount")(42), "42 karakter");
  assert.equal(t("en", "charCount")(42), "42 characters");
});

// Routing
ok("short text routes PREFER_ON_DEVICE", () => {
  assert.equal(chooseSummaryMode("hello world"), "PREFER_ON_DEVICE");
  assert.equal(
    chooseSummaryMode("x".repeat(ON_DEVICE_THRESHOLD_CHARS)),
    "PREFER_ON_DEVICE",
  );
});
ok("long text routes PREFER_IN_CLOUD", () => {
  assert.equal(
    chooseSummaryMode("x".repeat(ON_DEVICE_THRESHOLD_CHARS + 1)),
    "PREFER_IN_CLOUD",
  );
});
ok("empty text routes PREFER_ON_DEVICE", () => {
  assert.equal(chooseSummaryMode(""), "PREFER_ON_DEVICE");
  assert.equal(chooseSummaryMode("   "), "PREFER_ON_DEVICE");
});

// Prompts
ok("summary prompt is single-turn and carries the article", () => {
  const p = buildSummaryPrompt("Berita A.", "short", "id");
  assert.match(p, /Berita A\./);
  assert.match(p, /bahasa Indonesia/);
  assert.match(p, /3–4 kalimat/);
  const pEn = buildSummaryPrompt("News A.", "medium", "en");
  assert.match(pEn, /News A\./);
  assert.match(pEn, /English/);
  assert.match(pEn, /200–300 words/);
});
ok("summary prompt differs by length", () => {
  assert.notEqual(
    buildSummaryPrompt("x", "short", "id"),
    buildSummaryPrompt("x", "medium", "id"),
  );
});
ok("analysis prompt has the 3 required sections", () => {
  const p = buildAnalysisPrompt("Berita A.", "id");
  assert.match(p, /Klaim utama/);
  assert.match(p, /Konteks/);
  assert.match(p, /belum jelas/);
  const pEn = buildAnalysisPrompt("News A.", "en");
  assert.match(pEn, /Key claims/);
  assert.match(pEn, /Context/);
  assert.match(pEn, /missing or uncertain/);
});

// Rendering
ok("escapeHtml neutralizes markup", () => {
  assert.equal(
    escapeHtml('<script>alert("x")</script>'),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
  );
});
ok("renderRichText makes bullets and bold, escapes the rest", () => {
  const html = renderRichText(
    "Intro **penting**.\n- satu\n- dua\n\nParagraf <b>jahat</b>.",
  );
  assert.match(html, /<strong>penting<\/strong>/);
  assert.match(html, /<ul><li>satu<\/li><li>dua<\/li><\/ul>/);
  assert.match(html, /&lt;b&gt;jahat&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<script/);
});
ok("renderRichText handles empty input", () => {
  assert.equal(renderRichText(""), "<p></p>");
});

// Samples
ok("samples exist in both languages and route on-device", () => {
  assert.ok(SAMPLES.id.length > 100);
  assert.ok(SAMPLES.en.length > 100);
  assert.equal(chooseSummaryMode(SAMPLES.id), "PREFER_ON_DEVICE");
  assert.equal(chooseSummaryMode(SAMPLES.en), "PREFER_ON_DEVICE");
});

console.log(`\n${passed} tests passed.`);
