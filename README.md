# 🛡️ VeriFact — AI Fake News Detector

> An AI-powered web application that analyzes news articles, headlines, and paragraphs to detect misinformation, clickbait, and fake news in real-time.

![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-Modern-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![NewsAPI](https://img.shields.io/badge/NewsAPI-Integrated-FF6B6B?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Configuration](#api-configuration)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 🔍 Overview

**VeriFact** is a client-side fake news detection tool that uses heuristic AI analysis to evaluate the credibility of news content. Users can either paste text manually or pick trending headlines from the **live news feed** — powered by [NewsAPI](https://newsapi.org) — and analyze them with a single click.

The application classifies content into three categories:

| Classification | Description |
|---|---|
| ✅ **Real News** | Content appears factual, well-sourced, and professionally written |
| ❌ **Fake News** | Content exhibits multiple indicators of misinformation |
| ⚠️ **Uncertain** | Content shows some red flags but is not definitively fake |

---

## ✨ Features

### 🧠 AI-Powered Analysis Engine

The analysis engine evaluates text across **six critical dimensions**:

1. **Language Quality** — Detects ALL CAPS abuse, excessive punctuation, and poor sentence structure
2. **Sensationalism Detection** — Identifies 45+ sensational keywords and exaggerated claims
3. **Source Credibility** — Checks for credible references vs. vague/anonymous attributions
4. **Emotional Manipulation** — Detects 25+ clickbait phrases and emotional trigger words
5. **Logical Consistency** — Identifies absolute statements, contradictions, and logical fallacies
6. **Overall Factual Assessment** — Weighted scoring across all dimensions for final classification

### 📡 Live News Feed

- Real-time trending headlines from **NewsAPI**
- **7 category filters**: All, Technology, Health, Science, Business, Sports, Entertainment
- **"🔍 Analyze This"** button on every article — loads it directly into the analyzer
- Smart **CORS proxy fallback** chain for reliable fetching on all environments
- **5-minute caching** to minimize API calls
- **Refresh** button for fetching latest articles

### 🎨 Premium UI/UX

- Dark mode with indigo/cyan gradient accents
- Glassmorphism cards with backdrop blur effects
- Animated floating orbs background
- Skeleton loading animations for the news feed
- Smooth scroll-triggered animations
- Animated step-by-step loading sequence during analysis
- Fully responsive design (mobile → tablet → desktop)
- Custom scrollbar styling

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure |
| **CSS3** | Custom design system with CSS variables, gradients, glassmorphism |
| **Vanilla JavaScript** | Analysis engine, DOM manipulation, API integration |
| **Vite** | Development server, build tool, and HMR |
| **NewsAPI** | Real-time news headlines |
| **Google Fonts** | Inter & JetBrains Mono typography |

---

## ⚙️ How It Works

```
User Input (paste text or pick from live feed)
        │
        ▼
┌──────────────────────────────────┐
│       ANALYSIS ENGINE            │
│                                  │
│  1. Language Analysis       (15%)│
│  2. Sensationalism Check    (20%)│
│  3. Source Credibility      (25%)│
│  4. Emotional Manipulation  (20%)│
│  5. Logical Consistency     (20%)│
│                                  │
│  → Weighted Score Calculation    │
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│     CLASSIFICATION               │
│                                  │
│  Score ≥ 70  →  ✅ Real News     │
│  Score 45-69 →  ⚠️ Uncertain    │
│  Score < 45  →  ❌ Fake News     │
└──────────────────────────────────┘
        │
        ▼
  Detailed Report with:
  • Confidence level
  • Per-dimension scores
  • Key findings list
```

---

## 📁 Project Structure

```
fake-news-detector/
│
├── index.html          # Main HTML entry point
├── style.css           # Complete design system & responsive styles
├── app.js              # Core analysis engine with keyword dictionaries
├── news.js             # Live news feed module (NewsAPI integration)
│
├── package.json        # Vite dependency & npm scripts
├── vite.config.js      # Vite configuration
├── vercel.json         # Vercel deployment settings
├── .gitignore          # Git ignore rules
└── README.md           # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A free [NewsAPI](https://newsapi.org) API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/fake-news-detector.git
   cd fake-news-detector
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure your API key**

   Open `news.js` and replace the API key on line 9:

   ```javascript
   const NEWS_API_KEY = 'your_newsapi_key_here';
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   Visit `http://localhost:5173` — the app will open automatically.

### Build for Production

```bash
npm run build
```

The production-ready files will be generated in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 🔑 API Configuration

This project uses **NewsAPI** for the live news feed.

| Setting | Value |
|---|---|
| **API Provider** | [NewsAPI.org](https://newsapi.org) |
| **Free Tier Limit** | 100 requests/day |
| **Key Location** | `news.js` → Line 9 |
| **Endpoints Used** | `/v2/top-headlines` and `/v2/everything` |

### CORS Handling

NewsAPI's free tier blocks browser requests from production domains. The app uses a **3-tier fallback strategy**:

1. **Direct Fetch** — Works on `localhost` during development
2. **CORS Proxy** (`api.allorigins.win`) — Handles production deployments
3. **Alternative Endpoint** — Falls back to the `/everything` API if top-headlines fails

---

## 🌐 Deployment

### Deploy to Vercel

1. Push the code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. Vercel auto-detects Vite — click **Deploy**
5. Your app will be live in seconds! 🎉

**Or use the Vercel CLI:**

```bash
npx vercel
```

### Deployment Config (`vercel.json`)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

---

## 📸 Screenshots

### Hero Section & Analyzer
> Dark-themed hero with gradient accents, analyzer with real-time results panel showing classification, confidence meter, and detailed breakdown.

### Live News Feed
> Real-time trending headlines with category filters, article thumbnails, source badges, and one-click analyze functionality.

### Analysis Results
> Detailed verdict card with per-dimension scoring, confidence bar, and color-coded key findings.

---

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## ⚠️ Disclaimer

This tool provides **automated heuristic analysis** and should be used alongside your own critical thinking. It is not a substitute for professional fact-checking. Always verify information from multiple credible sources.

---

<p align="center">
  Built with ❤️ using Vite + Vanilla JS
</p>
