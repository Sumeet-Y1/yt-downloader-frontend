# YT Downloader Frontend

A responsive React + TypeScript frontend for downloading YouTube videos as **MP4** or **MP3**. Built with a monochrome, retro-brutalist aesthetic (cream background, bold pixel-style wordmark, black pill toggles) inspired by a vinyl-player music app UI, repurposed for a download tool.

**Live app:** deployed on [Cloudflare Pages](https://pages.cloudflare.com)
**Backend repo:** [yt-downloader (Spring Boot)](https://github.com/Sumeet-Y1/yt-downloader)

---

## ✨ Features

- 🔗 Paste a YouTube URL with live validation (only enables Download once the link looks valid)
- 🎚️ Format toggle - MP4 (video) vs MP3 (audio), styled as a segmented pill control
- ⬇️ One-click download - triggers a real browser file download (blob + hidden `<a>`), not just a link
- 🔄 Live status feedback - idle → fetching → converting → done/error, with a spinning "vinyl" loader and animated waveform progress bar
- 📱 Fully responsive - centered hero card on desktop, full-width thumb-friendly layout on mobile
- 🛡️ Strict TypeScript - no `any`, explicit unions for format and status state

---

## 🧱 Tech Stack

- **React** + **TypeScript** (strict mode), functional components, hooks only
- **Vite** (`react-ts` template)
- Plain **CSS** (no Tailwind, no UI libraries - custom design system)

---

## 📁 Project Structure

```
public/
├── favicon.svg
└── icons.svg

src/
├── App.tsx          # Main component: URL input, format toggle, download logic
├── App.css          # Component styling (monochrome design system)
├── index.css        # Global styles / resets
├── main.tsx          # React entry point
├── vite-env.d.ts     # ImportMetaEnv typing for VITE_API_BASE_URL
└── assets/
    └── hero.png       # Hero visual asset
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** 18+
- The [backend API](https://github.com/Sumeet-Y1/yt-downloader) running locally (or a deployed instance to point at)

### Setup

```bash
git clone https://github.com/Sumeet-Y1/yt-downloader-frontend.git
cd yt-downloader-frontend
npm install
npm run dev
```

The app runs on **`http://localhost:5173`** by default.

### Environment variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

For the deployed version, set this to your Render backend URL instead, e.g.:

```env
VITE_API_BASE_URL=https://yt-downloader-xxxx.onrender.com
```

If unset, the app falls back to `http://localhost:8080` for local dev.

---

## 🔌 API Integration

The frontend talks to a single backend endpoint:

```
POST {VITE_API_BASE_URL}/api/download
Content-Type: application/json

{ "url": "<youtube_url>", "format": "mp4" | "mp3" }
```

- **Success:** binary file stream → auto-downloaded via a blob URL
- **Error:** non-2xx response → shown as a human-readable message in the status area (no raw stack traces surfaced to the user)

During local development, `vite.config.ts` proxies `/api` requests to `http://localhost:8080` to avoid CORS issues.

---

## 🏗️ Build for Production

```bash
npm run build
```

Outputs a static build to `dist/`, ready to deploy to Cloudflare Pages (or any static host). Remember to set `VITE_API_BASE_URL` as an environment variable in your hosting provider's build settings so it points at your deployed backend.

---

## ⚠️ Known Limitation

This app depends on a backend using `yt-dlp`, which is occasionally rate-limited or bot-checked by YouTube (especially from cloud/datacenter IPs). If downloads fail with a "sign in to confirm you're not a bot" style error, that's a backend-side issue see the [backend repo's README](https://github.com/Sumeet-Y1/yt-downloader) for details and mitigations.

---

## 📄 License

Not yet decided all rights reserved by default until a license is added.

---

## ⚖️ Disclaimer

This project is intended for personal / educational use. Downloading copyrighted content from YouTube may violate YouTube's Terms of Service and/or copyright law depending on your jurisdiction and how the content is used. Use responsibly.