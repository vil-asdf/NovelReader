const STORAGE_KEY = 'novel_reader_state_v1';

let bookData = null;
let currentTab = 'all';
let homeFilter = 'all';
let state = {
  view: 'welcome',
  currentChapter: 1,
  lastReadChapter: null,
  hasStarted: false,
  theme: 'forest',
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 20,
  bookmarks: [],
  readChapters: []
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = {
        ...state,
        ...parsed,
        bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
        readChapters: Array.isArray(parsed.readChapters) ? parsed.readChapters : []
      };
      if (!state.lastReadChapter && state.hasStarted) {
        state.lastReadChapter = state.currentChapter;
      }
    }
  } catch (e) {
    console.warn('Could not load saved state', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save state', e);
  }
}

function applyPreferences() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === state.theme);
  });

  const contentEl = document.getElementById('chapter-content');
  contentEl.style.fontFamily = state.fontFamily;
  contentEl.style.fontSize = `${state.fontSize}px`;

  document.getElementById('font-family-select').value = state.fontFamily;
  document.getElementById('font-size-val').textContent = state.fontSize;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function downloadAllChaptersAsEpub() {
  if (!bookData || !bookData.chapters || bookData.chapters.length === 0) {
    alert('No chapters available to export.');
    return;
  }

  if (typeof JSZip === 'undefined') {
    alert('EPUB generator library (JSZip) is still loading or unavailable.');
    return;
  }

  const btns = [
    document.getElementById('download-epub-btn'),
    document.getElementById('hero-download-epub-btn')
  ].filter(Boolean);

  btns.forEach(b => {
    b.disabled = true;
    b.textContent = '⏳ Generating EPUB...';
  });

  try {
    const zip = new JSZip();
    const title = bookData.title || 'Surviving the Game as a Barbarian';
    const author = bookData.author || 'Jung Yoon-kang';
    const synopsis = bookData.synopsis || '';
    const bookId = 'urn:uuid:surviving-the-game-as-a-barbarian-en';

    // 1. mimetype (must be first and uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    zip.folder('META-INF').file(
      'container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    const oebps = zip.folder('OEBPS');

    // Stylesheet inside EPUB
    oebps.file(
      'style.css',
      `body { font-family: Georgia, serif; line-height: 1.7; margin: 5%; }
h1, h2 { text-align: center; margin-bottom: 1em; }
p { text-indent: 1.2em; margin-bottom: 0.8em; text-align: justify; }`
    );

    // Optional cover image if present on server
    let hasCover = false;
    try {
      const coverRes = await fetch('cover.jpg');
      if (coverRes.ok) {
        const coverBlob = await coverRes.blob();
        oebps.file('cover.jpg', coverBlob);
        hasCover = true;
      }
    } catch (_) {}

    let manifestItems = `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
`;

    if (hasCover) {
      manifestItems += `    <item id="cover-img" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>
`;
    }

    let spineItems = '';
    let navListItems = '';
    let ncxNavPoints = '';

    bookData.chapters.forEach((ch, index) => {
      const idx = index + 1;
      const filename = `chapter_${String(idx).padStart(4, '0')}.xhtml`;
      const itemId = `chap_${idx}`;
      const chapHeading = `Chapter ${ch.number}: ${ch.title}`;

      const paragraphsHtml = (ch.paragraphs || [])
        .map(p => `    <p>${escapeXml(p)}</p>`)
        .join('
');

      const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(chapHeading)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <h2>${escapeXml(chapHeading)}</h2>
${paragraphsHtml}
</body>
</html>`;

      oebps.file(filename, xhtml);

      manifestItems += `    <item id="${itemId}" href="${filename}" media-type="application/xhtml+xml"/>
`;
      spineItems += `    <itemref idref="${itemId}"/>
`;
      navListItems += `      <li><a href="${filename}">${escapeXml(chapHeading)}</a></li>
`;
      ncxNavPoints += `    <navPoint id="navPoint-${idx}" playOrder="${idx}">
      <navLabel><text>${escapeXml(chapHeading)}</text></navLabel>
      <content src="${filename}"/>
    </navPoint>
`;
    });

    // EPUB 3 Navigation Document
    oebps.file(
      'nav.xhtml',
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${navListItems}    </ol>
  </nav>
</body>
</html>`
    );

    // EPUB 2 NCX for backward compatibility
    oebps.file(
      'toc.ncx',
      `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
${ncxNavPoints}  </navMap>
</ncx>`
    );

    // content.opf
    const nowIso = new Date().toISOString().split('.')[0] + 'Z';
    oebps.file(
      'content.opf',
      `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:description>${escapeXml(synopsis)}</dc:description>
    <meta property="dcterms:modified">${nowIso}</meta>
  </metadata>
  <manifest>
${manifestItems}  </manifest>
  <spine toc="ncx">
${spineItems}  </spine>
</package>`
    );

    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip'
    });

    const safeFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'novel';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFilename}.epub`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating EPUB:', err);
    alert('Failed to generate EPUB file. Check console for details.');
  } finally {
    btns.forEach(b => {
      b.disabled = false;
      b.textContent = '⬇ Download EPUB';
    });
  }
}

function updateProgressUI() {
  if (!bookData) return;
  const total = bookData.chapters.length;
  const readCount = bookData.chapters.filter(c => state.readChapters.includes(c.number)).length;
  const pct = total > 0 ? Math.round((readCount / total) * 100) : 0;

  const statsEl = document.getElementById('reading-stats');
  if (statsEl) {
    statsEl.textContent = `${readCount} / ${total} chapters read (${pct}%)`;
  }

  const summaryEl = document.getElementById('progress-summary');
  if (readCount > 0 || state.hasStarted) {
    summaryEl.classList.remove('hidden');
    document.getElementById('welcome-progress-text').textContent = `Reading Progress: ${readCount} of ${total} chapters (${pct}%)`;
    document.getElementById('welcome-progress-fill').style.width = `${pct}%`;
  } else {
    summaryEl.classList.add('hidden');
  }
}

function getFilteredChapters(filter) {
  if (!bookData) return [];
  if (filter === 'bookmarks') {
    return bookData.chapters.filter(c => state.bookmarks.includes(c.number));
  }
  if (filter === 'unread') {
    return bookData.chapters.filter(c => !state.readChapters.includes(c.number));
  }
  return bookData.chapters;
}

function renderChapterList(filter = currentTab) {
  currentTab = filter;
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';

  const chapters = getFilteredChapters(filter);

  if (chapters.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No chapters found.';
    list.appendChild(empty);
    return;
  }

  chapters.forEach(ch => {
    const li = document.createElement('li');
    const isRead = state.readChapters.includes(ch.number);
    const isBookmarked = state.bookmarks.includes(ch.number);

    if (ch.number === state.currentChapter) li.classList.add('active');
    if (isRead) li.classList.add('is-read');

    const titleSpan = document.createElement('span');
    titleSpan.className = 'chap-item-title';
    titleSpan.textContent = `Chapter ${ch.number}: ${ch.title}`;

    const statusSpan = document.createElement('span');
    statusSpan.className = 'chap-status-icon';
    statusSpan.textContent = `${isBookmarked ? '★ ' : ''}${isRead ? '✓' : ''}`.trim();

    li.appendChild(titleSpan);
    li.appendChild(statusSpan);

    li.addEventListener('click', () => {
      openChapter(ch.number);
      document.getElementById('sidebar').classList.add('hidden');
    });
    list.appendChild(li);
  });
}

function renderHomeChapterGrid(filter = homeFilter) {
  homeFilter = filter;
  const grid = document.getElementById('home-chapter-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const chapters = getFilteredChapters(filter);
  if (chapters.length === 0) {
    grid.innerHTML = '<p class="subtitle">No chapters in this filter.</p>';
    return;
  }

  chapters.forEach(ch => {
    const isRead = state.readChapters.includes(ch.number);
    const isBookmarked = state.bookmarks.includes(ch.number);
    const isLastRead = state.lastReadChapter === ch.number;

    const card = document.createElement('div');
    card.className = 'home-chap-card';
    if (isRead) card.classList.add('is-read');
    if (isLastRead) card.classList.add('is-last-read');

    const info = document.createElement('div');
    const numEl = document.createElement('span');
    numEl.className = 'home-chap-num';
    numEl.textContent = `Chapter ${ch.number}${isLastRead ? ' • Last Read' : ''}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'home-chap-name';
    nameEl.textContent = ch.title;

    info.appendChild(numEl);
    info.appendChild(nameEl);

    const badges = document.createElement('span');
    badges.className = 'home-chap-badges';
    badges.textContent = `${isBookmarked ? '★ ' : ''}${isRead ? '✓' : ''}`.trim();

    card.appendChild(info);
    card.appendChild(badges);

    card.addEventListener('click', () => openChapter(ch.number));
    grid.appendChild(card);
  });
}

function updateChapterStatusControls() {
  const isBookmarked = state.bookmarks.includes(state.currentChapter);
  document.getElementById('bookmark-btn').textContent = isBookmarked ? '★' : '☆';

  const isRead = state.readChapters.includes(state.currentChapter);
  const markReadBtn = document.getElementById('mark-read-btn');
  const readBadge = document.getElementById('chapter-read-badge');

  markReadBtn.textContent = isRead ? '✓ Read' : 'Mark Read';
  markReadBtn.classList.toggle('active-state', isRead);
  readBadge.classList.toggle('hidden', !isRead);
}

function showWelcome() {
  state.view = 'welcome';
  saveState();

  document.getElementById('welcome-screen').classList.remove('hidden');
  document.getElementById('reader-container').classList.add('hidden');
  document.getElementById('home-btn').classList.add('hidden');
  document.getElementById('mark-read-btn').classList.add('hidden');

  const continueBtn = document.getElementById('continue-reading-btn');
  const startBtn = document.getElementById('start-reading-btn');

  if (state.hasStarted && state.lastReadChapter) {
    continueBtn.classList.remove('hidden');
    continueBtn.textContent = `Continue Reading (Chapter ${state.lastReadChapter})`;
    startBtn.className = 'secondary-btn';
    startBtn.textContent = 'Read from Chapter 1';
  } else {
    continueBtn.classList.add('hidden');
    startBtn.className = 'primary-btn';
    startBtn.textContent = 'Start Reading';
  }

  updateProgressUI();
  renderHomeChapterGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openChapter(chapterNum) {
  const chapter = bookData.chapters.find(c => c.number === chapterNum) || bookData.chapters[0];
  if (!chapter) return;

  state.currentChapter = chapter.number;
  state.lastReadChapter = chapter.number;
  state.hasStarted = true;
  state.view = 'reader';

  if (!state.readChapters.includes(chapter.number)) {
    state.readChapters.push(chapter.number);
  }
  saveState();

  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('reader-container').classList.remove('hidden');
  document.getElementById('home-btn').classList.remove('hidden');
  document.getElementById('mark-read-btn').classList.remove('hidden');

  document.getElementById('chapter-number').textContent = `Chapter ${chapter.number}`;
  document.getElementById('chapter-title').textContent = chapter.title;

  const contentEl = document.getElementById('chapter-content');
  contentEl.innerHTML = '';
  chapter.paragraphs.forEach(text => {
    const p = document.createElement('p');
    p.textContent = text;
    contentEl.appendChild(p);
  });

  const idx = bookData.chapters.findIndex(c => c.number === chapter.number);
  document.getElementById('prev-chapter').disabled = idx <= 0;
  document.getElementById('next-chapter').disabled = idx >= bookData.chapters.length - 1;
  document.getElementById('progress-indicator').textContent = `${idx + 1} / ${bookData.chapters.length}`;

  updateChapterStatusControls();
  updateProgressUI();
  renderChapterList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function init() {
  loadState();
  applyPreferences();

  try {
    const res = await fetch('data/chapters.json');
    bookData = await res.json();
  } catch (err) {
    console.error('Failed to load chapters.json', err);
    return;
  }

  if (bookData.title && bookData.title !== 'Untitled Novel (English Edition)') {
    document.title = `${bookData.title} — Reader`;
    document.getElementById('novel-title').textContent = bookData.title;
    document.getElementById('welcome-title').textContent = bookData.title;
  }
  if (bookData.author && bookData.author !== 'Author Name') {
    document.getElementById('novel-author').textContent = bookData.author;
    document.getElementById('welcome-author').textContent = bookData.author;
  }

  updateProgressUI();
  renderChapterList();
  renderHomeChapterGrid();
  showWelcome();

  document.getElementById('download-epub-btn').addEventListener('click', downloadAllChaptersAsEpub);
  document.getElementById('hero-download-epub-btn').addEventListener('click', downloadAllChaptersAsEpub);

  document.getElementById('continue-reading-btn').addEventListener('click', () => {
    openChapter(state.lastReadChapter || state.currentChapter || 1);
  });

  document.getElementById('start-reading-btn').addEventListener('click', () => {
    openChapter(1);
  });

  document.getElementById('home-btn').addEventListener('click', showWelcome);
  document.getElementById('footer-home-btn').addEventListener('click', showWelcome);

  document.getElementById('prev-chapter').addEventListener('click', () => {
    const idx = bookData.chapters.findIndex(c => c.number === state.currentChapter);
    if (idx > 0) openChapter(bookData.chapters[idx - 1].number);
  });

  document.getElementById('next-chapter').addEventListener('click', () => {
    const idx = bookData.chapters.findIndex(c => c.number === state.currentChapter);
    if (idx < bookData.chapters.length - 1) openChapter(bookData.chapters[idx + 1].number);
  });

  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('hidden');
  });

  document.getElementById('close-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('hidden');
  });

  document.getElementById('toggle-settings').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('hidden');
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.theme = btn.dataset.theme;
      applyPreferences();
      saveState();
    });
  });

  document.getElementById('font-family-select').addEventListener('change', (e) => {
    state.fontFamily = e.target.value;
    applyPreferences();
    saveState();
  });

  document.getElementById('font-inc').addEventListener('click', () => {
    if (state.fontSize < 32) {
      state.fontSize += 2;
      applyPreferences();
      saveState();
    }
  });

  document.getElementById('font-dec').addEventListener('click', () => {
    if (state.fontSize > 14) {
      state.fontSize -= 2;
      applyPreferences();
      saveState();
    }
  });

  document.getElementById('mark-read-btn').addEventListener('click', () => {
    const idx = state.readChapters.indexOf(state.currentChapter);
    if (idx === -1) {
      state.readChapters.push(state.currentChapter);
    } else {
      state.readChapters.splice(idx, 1);
    }
    updateChapterStatusControls();
    updateProgressUI();
    renderChapterList();
    renderHomeChapterGrid();
    saveState();
  });

  document.getElementById('bookmark-btn').addEventListener('click', () => {
    const idx = state.bookmarks.indexOf(state.currentChapter);
    if (idx === -1) {
      state.bookmarks.push(state.currentChapter);
    } else {
      state.bookmarks.splice(idx, 1);
    }
    updateChapterStatusControls();
    renderChapterList();
    renderHomeChapterGrid();
    saveState();
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChapterList(btn.dataset.tab);
    });
  });

  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHomeChapterGrid(btn.dataset.homeFilter);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
