# Build Report — Ringkasan Berita (News Digest) for #BuildHybridAI 2026

Built 18 Nov 2026, ~22:10–22:15 WIB. Idea #2 ("Ringkasan Berita"), picked by
Rise under Mikasa's "Atur aja" delegation. Submission deadline: **1 Dec 2026
05:00 WIB**.

## What was built

Static web app (no build step) in `~/workspace/buildhybridai/ringkasan-berita/`:

| File | Purpose |
| --- | --- |
| `index.html` | UI + Firebase import map (JS SDK **v12.5.0**, pinned) |
| `styles.css` | Mobile-first styles, no framework |
| `app.js` | Firebase init, App Check, model instances, UI wiring |
| `lib.js` | Pure helpers (i18n, routing, prompts, safe rendering) — no Firebase imports |
| `test-lib.mjs` | Node unit tests for `lib.js` |
| `README.md` | English setup + usage docs |
| `LICENSE` | MIT (satisfies the contest's open-source-license requirement) |

Features, as specified:

- Paste news text (ID or EN), summary length Short / Medium.
- **Summary routing:** text ≤ 2,000 chars → `InferenceMode.PREFER_ON_DEVICE`
  (Gemini Nano first, cloud fallback); longer text → `PREFER_IN_CLOUD`.
  A badge on every result shows the engine that actually ran it, read from
  `response.inferenceSource` (`ON_DEVICE` / `IN_CLOUD`), with a
  `LanguageModel.availability()` probe as fallback (badge says how it was
  determined).
- **Deep Analysis** button (key claims, context & background, missing /
  uncertain) — always `PREFER_IN_CLOUD`.
- **ID/EN toggle** for the UI and the model output language.
- "How hybrid inference works" note inside the app; sample-article button;
  char counter; clean mobile-friendly UI.
- **Firebase config is a clearly-marked `YOUR_...` placeholder** in `app.js`
  (to be replaced with the real project config). With the placeholder, the
  app still loads, the whole UI works, and the AI buttons show a setup banner
  instead of failing cryptically.
- **App Check** wired with the debug-token flow
  (`self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` + `ReCaptchaEnterpriseProvider`
  with a placeholder site key); the console prints a debug token to safelist.
- The code **actually imports and calls Firebase AI Logic at runtime**:
  `getAI`, `getGenerativeModel` with `InferenceMode`, `generateContent`,
  `model.initializeDeviceModel()` (on the user gesture, before on-device
  calls). No README-only mention.

## What was verified (without a real Firebase project)

- **CDN availability:** `firebase-app.js`, `firebase-ai.js`,
  `firebase-app-check.js` v12.5.0 all return HTTP 200 from
  `www.gstatic.com/firebasejs/12.5.0/` (checked 18 Nov ~22:11 WIB).
- **API surface:** the downloaded `firebase-ai.js` exports `getAI`,
  `getGenerativeModel`, `GoogleAIBackend`, `InferenceMode`, `InferenceSource`;
  `firebase-app-check.js` exports `initializeAppCheck`,
  `ReCaptchaEnterpriseProvider`. (Method `initializeDeviceModel` is not a
  literal string in the minified bundle, but it is in the official docs'
  getting-started code and the app calls it behind a `typeof` guard.)
- **Unit tests:** `node test-lib.mjs` — **14/14 passed** (i18n + fallback,
  routing threshold at exactly 2,000 chars, prompt content per language and
  length, analysis 3-section structure, HTML escaping, rich-text rendering,
  samples routing on-device).
- **Syntax:** `node --check` passes for `lib.js`, `app.js`, `test-lib.mjs`.
- **Import map:** JSON valid; all three Firebase entries pin v12.5.0; all
  required Firebase identifiers are present in `app.js`.
- **Local server:** `python3 -m http.server` — all 7 files return **HTTP 200**
  with correct content types; index.html contains the import map and loads
  `app.js`.

## What could NOT be tested (needs a real Firebase project)

- Actual `generateContent()` calls (summary + analysis) against Gemini.
- The on-device vs cloud badge in a real browser (needs Chrome Desktop 139+
  with Gemini Nano downloaded, plus a real config).
- `initializeDeviceModel()` download-progress flow.
- App Check attestation end-to-end (needs a real project + safelisted debug
  token, or a real reCAPTCHA Enterprise site key).
- Rendering in a real browser (this VM's local Chromium has no internet, so
  it cannot load the Firebase CDN). The page was verified by serving + static
  checks only — see above.

## What remains (not done, per the task)

1. **Firebase project:** create it, enable AI Logic (Gemini Developer API),
   copy the web config into `app.js`, replace
   `RECAPTCHA_ENTERPRISE_SITE_KEY`, safelist the App Check debug token.
2. **GitHub repo:** create a public repo, push these files, add the repo link
   to the submission. (Do not commit any real secrets; the Firebase web
   config is public by design.)
3. **Deploy:** host on GitHub Pages (static site, no build step).
4. **Demo video:** ≤ 3 min on YouTube, English or English subtitles —
   screen-record the app working (ideally showing both the on-device badge on
   Chrome Desktop and the cloud fallback). Needs a phone/computer recording;
   cannot be generated from this VM.
5. **Devpost submit:** text description + repo URL + video link before
   1 Dec 2026 05:00 WIB. Judging 10–16 Dec, winners ~21 Dec.
6. Optional: Google Account Quota (only for advanced models like image
   generation — NOT needed for this text-only app). Sprint 3 final request by
   25 Nov 10:00 PT.

## Design notes / risks

- On-device inference only supports **single-turn text generation** — all
  prompts here are single-turn, by design.
- The 2,000-char routing threshold is a product choice, not a model limit;
  it keeps short summaries fast/private on-device while long articles get
  the stronger cloud model.
- If the judges open the app in a non-Chrome browser, everything still works
  via the cloud fallback and the badge says so — the hybrid story holds up
  either way.
