const STORAGE_KEY = 'novel_reader_state_v1';

let bookData = null;
let currentTab = 'all';
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

function renderChapterList(filter = currentTab) {
  currentTab = filter;
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';

  let chapters = bookData.chapters;
  if (filter === 'bookmarks') {
    chapters = bookData.chapters.filter(c => state.bookmarks.includes(c.number));
  } else if (filter === 'unread') {
    chapters = bookData.chapters.filter(c => !state.readChapters.includes(c.number));
  }

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
  document.getElementById('reader-view').classList.add('hidden');
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
  document.getElementById('reader-view').classList.remove('hidden');
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

  document.title = `${bookData.title} — Reader`;
  document.getElementById('novel-title').textContent = bookData.title;
  document.getElementById('novel-author').textContent = bookData.author;
  document.getElementById('welcome-title').textContent = bookData.title;
  document.getElementById('welcome-author').textContent = `By ${bookData.author}`;
  document.getElementById('welcome-synopsis').textContent = bookData.synopsis;

  updateProgressUI();
  renderChapterList();

  // Always start on the cover/welcome screen when opening the site so the user sees read markers and "Continue Reading"
  showWelcome();

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
    saveState();
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChapterList(btn.dataset.tab);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
