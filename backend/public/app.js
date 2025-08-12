console.log('[PixelFree] app.js loaded');

window.addEventListener('error', e => console.error('Global error:', e.error || e.message));

const CAPTION_MAX_LENGTH = 60;

// ===== Element refs =====
const statusEl   = document.getElementById('status');
const loginBtn   = document.getElementById('loginBtn');
const logoutBtn  = document.getElementById('logoutBtn');

const tagsInput  = document.getElementById('tagsInput');
const usersInput = document.getElementById('usersInput');
const limitInput = document.getElementById('limitInput');
const searchBtn  = document.getElementById('searchBtn');

const grid    = document.getElementById('imageGrid');        // required
const loading = document.getElementById('loadingIndicator'); // optional spinner
const empty   = document.getElementById('empty');            // optional empty-state

// ===== Helpers =====
async function getJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function setLoading(isLoading) {
  document.body.classList.toggle('is-loading', isLoading);
  if (searchBtn) searchBtn.disabled = isLoading;
}

function splitList(str) {
  return String(str || '')
    .split(/[,\s]+/)          // commas or whitespace
    .map(s => s.trim())
    .filter(Boolean);
}

function normalizeTags(list) {
  // strip leading '#' and trim
  return list.map(t => t.replace(/^#/, '').trim()).filter(Boolean);
}

function normalizeAccts(list) {
  // Accept @user@host or profile URLs; return acct (user@host)
  return list
    .map(s => s.trim())
    .map(s => {
      if (/^https?:\/\//i.test(s)) {
        // try to extract acct from common profile URL patterns like https://host/@user
        try {
          const u = new URL(s);
          const match = u.pathname.match(/\/@([^/]+)/);
          if (match) return `${match[1]}@${u.hostname}`;
        } catch { /* ignore */ }
      }
      return s.startsWith('@') ? s.slice(1) : s; // drop leading '@' if present
    })
    .filter(Boolean);
}

// ===== Auth =====
async function checkAuth() {
  try {
    statusEl && (statusEl.textContent = 'Checking auth...');
    const s = await getJSON('/api/auth/status');
    if (s.authenticated) {
      statusEl && (statusEl.textContent = 'Authenticated');
      loginBtn && (loginBtn.hidden = true);
      logoutBtn && (logoutBtn.hidden = false);
    } else {
      statusEl && (statusEl.textContent = 'Not authenticated');
      loginBtn && (loginBtn.hidden = false);
      logoutBtn && (logoutBtn.hidden = true);
    }
  } catch (e) {
    console.error(e);
    statusEl && (statusEl.textContent = 'Error checking auth');
  }
}

async function login() {
  try {
    const { loginUrl } = await getJSON('/api/login');
    if (loginUrl) window.location.href = loginUrl;
  } catch (e) {
    console.error(e);
    alert('Login failed. See console for details.');
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    await checkAuth();
    clearGrid();
  } catch (e) {
    console.error(e);
  }
}

// ===== Photos (rendering) =====
function clearGrid() {
  if (grid) grid.innerHTML = '';
  if (empty) {
    empty.hidden = false;
    empty.textContent = 'No photos yet. Enter tags and/or users, then click “Search”.';
  }
}

function renderPhotos(photos) {
  grid.innerHTML = '';
  if (!photos.length) {
    if (empty) { empty.hidden = false; empty.textContent = 'No photos found.'; }
    return;
  }
  if (empty) empty.hidden = true;

  const frag = document.createDocumentFragment();

  for (const p of photos) {
    const card = document.createElement('div');
    card.className = 'card';

    // 1) Clickable image → open full-size (media URL)
    const link = document.createElement('a');
    link.href = p.url || '#';
    link.target = '_blank';
    link.rel = 'noopener';

    const img = document.createElement('img');
    img.src = p.preview_url || p.url;
    img.loading = 'lazy';
    img.alt = (Array.isArray(p.tags) && p.tags.length) ? p.tags.join(', ') : 'photo';

    link.appendChild(img);
    card.appendChild(link);

    // 2) Caption (clickable for details)
    const captionText = truncateText(htmlToText(p.caption || p.content || 'View details'), CAPTION_MAX_LENGTH);
    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = captionText;

    // 3) Click caption → popup with details
    caption.addEventListener('click', () => {
      openInfoModal({
        captionHtml: p.caption || p.content || '',
        author: p.author || {},
        author_display_name: p.author_display_name || (p.author?.username),
        created_at: p.created_at,
        location: p.location,                  // may be undefined
        post_url: p.post_url || p.status_url,  // may be undefined
        media_url: p.url
      });
    });

    card.appendChild(caption);
    frag.appendChild(card);
  }

  grid.appendChild(frag);
}

// --- helpers for caption text ---
const htmlToText = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return (tmp.textContent || tmp.innerText || '').trim();
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength
    ? text.slice(0, maxLength - 1) + '…'
    : text;
};

function getLimit() {
  const v = Number(limitInput?.value || 7);
  const n = Number.isFinite(v) ? v : 7;
  return Math.max(1, Math.min(7, n));
}

function buildQueryBody() {
  const tags  = normalizeTags(splitList(tagsInput?.value));
  const accts = normalizeAccts(splitList(usersInput?.value));
  const limit = getLimit();

  if (!tags.length && !accts.length) {
    alert('Please enter at least one tag or one user.');
    return null;
  }

  if (tags.length && accts.length) {
    return { type: 'compound', tags, users: { accts }, limit };
  } else if (tags.length) {
    return { type: 'tag', tags, limit };
  } else {
    return { type: 'user', accts, limit };
  }
}

// --- Modal control ---
const modal = document.getElementById('infoModal');
const modalBackdrop = modal?.querySelector('.modal-backdrop');
const modalClose = document.getElementById('modalClose');
const modalContent = document.getElementById('modalContent');

function openInfoModal(info) {
  if (!modal || !modalContent) return;
  const dateStr = info.created_at ? new Date(info.created_at).toLocaleString() : '—';
  const byline = info.author_display_name || info.author?.username || 'Unknown';
  const loc = info.location ? formatLocation(info.location) : '—';

  modalContent.innerHTML = `
    <div class="row"><strong>By:</strong> <span>${escapeHtml(byline)}</span></div>
    <div class="row"><strong>When:</strong> <span>${escapeHtml(dateStr)}</span></div>
    <div class="row"><strong>Location:</strong> <span>${escapeHtml(loc)}</span></div>
    ${info.post_url ? `<div class="row"><strong>Post:</strong> <a href="${info.post_url}" target="_blank" rel="noopener">${info.post_url}</a></div>` : ''}
    <div style="margin-top:10px; border-top:1px solid var(--border); padding-top:10px;">
      ${info.captionHtml || '<em>No caption</em>'}
    </div>
  `;
  modal.hidden = false;
}

function closeInfoModal() { if (modal) modal.hidden = true; }

modalClose?.addEventListener('click', closeInfoModal);
modalBackdrop?.addEventListener('click', closeInfoModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeInfoModal();
});

function escapeHtml(str='') {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function formatLocation(loc) {
  // Handle either a simple string or an object { name, city, country, ... }
  if (typeof loc === 'string') return loc;
  if (loc && typeof loc === 'object') {
    return [loc.name, loc.city, loc.region, loc.country].filter(Boolean).join(', ') || '—';
  }
  return '—';
}

// ===== Advanced query against /api/photos/query =====
async function runSearch() {
  const body = buildQueryBody();
  if (!body) return;

  setLoading(true);
  if (empty) empty.hidden = true;
  if (grid) grid.innerHTML = '';

  try {
    const res = await fetch('/api/photos/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }

    const photos = await res.json();
    renderPhotos(Array.isArray(photos) ? photos : []);
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<p class="error">Search failed. See console for details.</p>';
  } finally {
    setLoading(false);
  }
}

// ===== Wire up events =====
loginBtn  && loginBtn.addEventListener('click', login);
logoutBtn && logoutBtn.addEventListener('click', logout);
searchBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  runSearch().catch(console.error);
});

// Submit on Enter in any field
[tagsInput, usersInput, limitInput].forEach(el => {
  el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch().catch(console.error);
    }
  });
});

// ===== Launch =====
setLoading(false);
checkAuth();
clearGrid(); // show initial hint
