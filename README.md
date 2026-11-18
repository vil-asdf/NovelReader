# Novel Web Reader (English Edition)

A lightweight, static web reader for publishing and reading novels directly via GitHub Pages.

## Project Structure

- `index.html` — Main reader interface (Table of Contents, Settings, Chapter View).
- `style.css` — Responsive styling with **Light**, **Forest**, and **Dark** themes.
- `script.js` — Chapter navigation, bookmarking, typography controls, and `localStorage` state persistence.
- `data/chapters.json` — Structured novel metadata and chapter paragraphs.
- `epub_to_json.py` — Helper Python script to convert an `.epub` file directly into `data/chapters.json` locally.

## How to Populate Content Locally

1. Place your `.epub` file in the root folder of this repository.
2. Run the helper script:
   ```bash
   python epub_to_json.py your-book.epub
   ```
3. Commit and push the updated `data/chapters.json` to GitHub.

## Deploying to GitHub Pages

1. Go to your repository on GitHub: **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
3. Select the `main` branch and `/ (root)` folder, then click **Save**.
