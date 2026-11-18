# Surviving the Game as a Barbarian — Web Reader (Chapters 1–823)

A static, GitHub Pages–ready web reader for **Surviving the Game as a Barbarian** (*게임 속 바바리안으로 살아남기*) by Jung Yoon-kang (정윤강), complete with Chapters 1 through 823.

## Included Files

- `index.html` — Hero cover landing page, chapter directory, sidebar drawer, typography settings, and reading view.
- `style.css` — Responsive themes (**Light**, **Forest**, and **Dark**), blurred cover hero backdrop, and chapter grid styling.
- `script.js` — Chapter navigation, instant chapter search, pagination, read/unread & bookmark tracking (`localStorage`), and client-side **Download EPUB** export (`JSZip`).
- `cover.jpg` — Official cover thumbnail used for the hero card, blurred hero background, favicon, and exported EPUB cover.
- `data/chapters.json` — Complete 823-chapter structured dataset.
- `epub_to_json.py` — Local Python utility to convert updated `.epub` releases into `data/chapters.json`.

## Updating Your Git Repository & GitHub Pages

1. Extract all files from the archive into the root of your repository (replacing the older files).
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Add cover thumbnail and full chapters 1-823"
   git push origin main
   ```
3. In GitHub **Settings > Pages**, ensure **Source** is set to `Deploy from a branch` (`main` / `/ (root)`).
