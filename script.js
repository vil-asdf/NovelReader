const STORAGE_KEY = 'novel_reader_state_v1';

let bookData = null;
let state = {
  view: 'welcome',
  currentChapter: 1,
  hasStarted: false,
  theme: 'forest',
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 20,
  bookmarks: []
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = { ...state, ...JSON.parse(saved) };
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

function renderChapterList(filter = 'all') {
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';
  const chapters = filter === 'bookmarks'
    ? bookData.chapters.filter(c => state.bookmarks.includes(c.number))
    : bookData.chapters;

  if (chapters.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No chapters found.';
    list.appendChild(empty);
    return;
  }

  chapters.forEach(ch => {
    const li = document.createElement('li');
    li.textContent = `Chapter ${ch.number}: ${ch.title}`;
    if (ch.number === state.currentChapter) li.classList.add('active');
    li.addEventListener('click', () => {
      openChapter(ch.number);
      document.getElementById('sidebar').classList.add('hidden');
    });
    list.appendChild(li);
  });
}

function updateBookmarkIcon() {
  const btn = document.getElementById('bookmark-btn');
  const isBookmarked = state.bookmarks.includes(state.currentChapter);
  btn.textContent = isBookmarked ? '★' : '☆';
}

function openChapter(chapterNum) {
  const chapter = bookData.chapters.find(c => c.number === chapterNum) || bookData.chapters[0];
  if (!chapter) return;

  state.currentChapter = chapter.number;
  state.hasStarted = true;
  state.view = 'reader';
  saveState();

  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('reader-view').classList.remove('hidden');

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

  updateBookmarkIcon();
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

  renderChapterList();

  if (state.hasStarted && state.view === 'reader') {
    openChapter(state.currentChapter);
  }

  document.getElementById('start-reading-btn').addEventListener('click', () => {
    openChapter(state.currentChapter || 1);
  });

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

  document.getElementById('bookmark-btn').addEventListener('click', () => {
    const idx = state.bookmarks.indexOf(state.currentChapter);
    if (idx === -1) {
      state.bookmarks.push(state.currentChapter);
    } else {
      state.bookmarks.splice(idx, 1);
    }
    updateBookmarkIcon();
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
