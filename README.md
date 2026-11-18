# 📖 Surviving the Game as a Barbarian || Novel Reader — Literature Without Barriers

> **Great stories shouldn't be locked behind abusive paywalls, sluggish interfaces, or intrusive ads.**

**Novel Reader** is an open-source, ultra-fast static web reading platform dedicated to democratizing access to literary works and webnovels. Built with an uncompromising focus on the reader's experience, it transforms digital reading into a quiet, customizable, and distraction-free sanctuary on any device—with zero ads, zero trackers, and zero friction.

🌐 **[Launch the Online Reader](https://stgaab.pages.dev/)** *(Currently featuring: Surviving the Game as a Barbarian — Chapters 1–823)*

---

## 💡 How the Project Was Conceived

The idea was born from a frustration shared by every avid webnovel reader: bloated websites, aggressive pop-ups, jarring typography, and constantly losing your place between chapters.

Inspired by the cleanest minimalist reading experiences on the modern web, **Novel Reader** was architected from the ground up around a **Privacy-First & Zero-Backend** philosophy:

* **Blazing Speed:** Built with pure, vanilla HTML, CSS, and JavaScript—no heavy frameworks—ensuring near-instant page loads even on slow mobile connections.
* **Your Data Stays Yours:** Your reading progress, read/unread chapter markers, bookmarks, and visual settings are saved locally in your browser (`localStorage`). No accounts, no logins, and no data collection.
* **True Offline Freedom:** With a single click, your browser compiles all available chapters—complete with cover art and table of contents—into a clean `.epub` file ready for your Kindle, Kobo, or favorite e-reader app.

---

## ✨ Key Features

* 🎨 **Eye-Friendly Themes:** Switch seamlessly between **Forest** (default dark-green palette engineered for strain-free late-night reading), **Light**, and **Dark** modes.
* 🔠 **Tailored Typography:** Choose between classic Serif (*Georgia*), clean Sans-Serif, or Monospace fonts, with granular font-size controls.
* 🔖 **Smart Progress Tracking:** Automatic and manual *Read* (`✓`) status markers, a visual completion bar on the homepage, dedicated *Unread* and *Bookmarks* (`★`) filters, and a one-click **Continue Reading** button that picks up right where you left off.
* 🔍 **Instant Navigation at Scale:** Dual real-time search (both in the slide-out drawer and the homepage directory) paired with batched pagination (60 chapters per load), making it effortless to navigate 800+ chapters.
* 📥 **One-Click Client-Side EPUB Export:** Generate and download a complete, e-reader-ready `.epub` bundle directly in your browser using `JSZip`.

---

## 🚀 Continuously Maintained & Updated

This is an actively maintained, living project. Because flagship titles in our catalog are ongoing serialized works, the platform evolves alongside the story:

* **Regular Chapter Releases:** New chapters are formatted, proofread for punctuation and continuity, and published continuously as they are released.
* **Ongoing Improvements:** Accessibility refinements, performance optimizations, and reader-requested features are rolled out regularly to elevate your reading experience.

---

## ☕ Support the Mission

Keeping an independent, ad-free platform running and regularly updated takes time, careful text curation, and ongoing technical maintenance. 

If this reader has made your literary journey more enjoyable and you would like to help keep the project free, active, and growing with new chapters, consider supporting our work:

> 🚧 **Donation Channels — Coming Soon!**
> *We are currently setting up official support links (Ko-fi / Buy Me a Coffee / Pix). Check back soon or star/watch this repository for updates!*

*(All contributions go directly toward project maintenance, text quality assurance, and expanding the catalog.)*

---

## 🛠️ Technical Architecture (For Developers)

If you want to inspect the code, contribute, or adapt this reader for public-domain or original works:

* `index.html` — Semantic markup for the atmospheric hero landing page, chapter directory, and distraction-free reading view, integrating `JSZip` for client-side EPUB packaging.
* `style.css` — Responsive layout driven by CSS custom properties for instant theme switching.
* `script.js` — Paginated directory renderer, real-time chapter search, in-browser EPUB builder, and `localStorage` state persistence.
* `data/chapters.json` — Structured novel metadata and chapter corpus.
* `cover.jpg` — Cover artwork rendered on the landing page, hero backdrop, browser favicon, and embedded inside exported EPUBs.
* `epub_to_json.py` — Standalone Python utility (standard library only, zero external dependencies) to parse `.epub` files into `data/chapters.json`.

---

## ⚖️ Disclaimer

This project is strictly educational, community-driven, and non-commercial, created to promote reading accessibility and clean digital preservation. All copyrights to the literary works and cover artwork featured belong to their respective authors, illustrators, and publishers. Please support the official releases whenever available.
