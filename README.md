# Ringkasan Berita (News Digest)

A #BuildHybridAI 2026 entry: paste a news article and get a summary plus a
deep analysis, powered by **Firebase AI Logic hybrid inference** — Gemini Nano
on-device when possible, Gemini in the cloud otherwise.

## What it does

- **Summarize** — paste news text (Indonesian or English), pick a length
  (Short / Medium), get a concise, neutral summary.
- **Deep Analysis** — key claims, context & background, and what is missing
  or uncertain.
- **Hybrid inference, visible** — every result carries a badge showing which
  engine actually ran it: **On-device · Gemini Nano** or **Cloud · Gemini**.
- **ID/EN toggle** — the whole UI and the model output switch languages.
- **Sample article** — one click fills in a sample story so the app can be
  tried instantly.

## How hybrid inference works here

The app uses the Firebase AI Logic client SDK for Web
(`firebase/ai`, SDK v12.5.0+, via CDN import map):

| Task | Mode | Why |
| --- | --- | --- |
| Summary, text ≤ 2,000 chars | `InferenceMode.PREFER_ON_DEVICE` | Try Gemini Nano on-device first (private, free, offline-capable); the SDK falls back to cloud Gemini if the device can't run it. |
| Summary, text > 2,000 chars | `InferenceMode.PREFER_IN_CLOUD` | Long texts go straight to cloud Gemini. |
| Deep Analysis | `InferenceMode.PREFER_IN_CLOUD` | Always cloud — it needs heavier reasoning. |

Before a summary, the app calls `model.initializeDeviceModel()` (on a user
gesture, as required) so the on-device model can download in the background.
After each request it reads `response.inferenceSource` (`ON_DEVICE` or
`IN_CLOUD`) for the badge; if the SDK does not report it, the app falls back
to a `LanguageModel.availability()` probe and says so on the badge.

Constraints that shaped the design (from the official Firebase docs):

- On-device inference works on **Chrome Desktop 139+** only, and only for
  **single-turn text generation** (not chat). All prompts in this app are
  single-turn.
- **Firebase App Check is enforced** for AI Logic. This app wires App Check
  with the debug-token flow for development (see Setup).
- The repo must actually import and call Firebase AI Logic at runtime — it
  does: `getAI`, `getGenerativeModel` with `InferenceMode`, and
  `generateContent` are called from `app.js`.

## Setup (one-time, before the demo)

1. Create a Firebase project and enable **AI Logic** (choose the **Gemini
   Developer API** provider — free tier, no billing needed for text).
2. In the Firebase console, register a Web app and copy its config into the
   `firebaseConfig` object at the top of `app.js` (it is a clearly-marked
   `YOUR_...` placeholder right now).
3. Replace `RECAPTCHA_ENTERPRISE_SITE_KEY` in `app.js` with your reCAPTCHA
   Enterprise site key (App Check). For local testing, keep the debug-token
   flow: the browser console prints an App Check debug token — safelist it in
   Firebase console > **App Check > Manage debug tokens**.
4. On-device model (for the demo): use Chrome Desktop 139+, enable
   `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, and let the
   model download once (`LanguageModel.availability()` should report
   `available`). Without it, everything still works — the SDK falls back to
   the cloud and the badge says so.

## Run locally

No build step. Serve the folder over HTTP (module scripts need it):

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

## Deploy

This is a static site — it can be hosted as-is on GitHub Pages (or any
static host). Push this folder's contents to the repo root (or a `docs/`
folder) and enable Pages. No secrets are committed: the Firebase web config
is public by design, and API access is protected by App Check.

## Tests

```bash
node test-lib.mjs   # 14 unit tests for the pure helpers in lib.js
```

`lib.js` has no Firebase imports, so its routing, prompt building, i18n and
output rendering are fully testable in Node. The Firebase call paths in
`app.js` can only be exercised end-to-end with a real Firebase project (see
BUILD_REPORT.md).

## Project structure

```
index.html      UI + Firebase import map (SDK v12.5.0, pinned)
styles.css      Mobile-first styles, no framework
app.js          Firebase init, App Check, models, UI wiring
lib.js          Pure helpers: i18n, routing, prompts, safe rendering
test-lib.mjs    Node unit tests for lib.js
README.md       This file
BUILD_REPORT.md What was built, verified, and what remains
LICENSE         MIT
```

## License

MIT — see LICENSE.
