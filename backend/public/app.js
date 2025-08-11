window.addEventListener('error', e => console.error('Global error:', e.error || e.message));

const CAPTION_MAX_LENGTH = 60;

// ===== Element refs =====
const statusEl   = document.getElementById('status');
const loginBtn   = document.getElementById('loginBtn');
const logoutBtn  = document.getElementById('logoutBtn');
const loadBtn    = document.getElementById('loadBtn');
const queryInput = document.getElementById('queryInput');
const countInput = document.getElementById('countInput'); // optional

const grid    = document.getElementById('imageGrid');      // required
const loading = document.getElementById('loadingIndicator'); // required
const empty   = document.getElementById('empty');          // optional

// ===== Helpers =====
async function getJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function setLoading(isLoading) {
  document.body.classList.toggle('is-loading', isLoading);
  if (loadBtn) loadBtn.disabled = isLoading;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ===== Auth =====
async function checkAuth() {
  try {
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

// ===== Photos =====
function clearGrid() {
  if (grid) grid.innerHTML = '';
  if (empty) {
    empty.hidden = false;
    empty.textContent = 'No photos yet. Try a tag and click “Load Photos”.';
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

    // 2) Replace date/open with caption (clickable)
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

function normalizeAcctInput(raw) {
  // Accept @user, @user@domain, or profile URLs; clean common copy/paste cases.
  let s = String(raw).trim();

  // Strip leading @
  if (s.startsWith('@')) s = s.slice(1);

  // If it's a URL, try to parse common patterns and convert to acct form
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      // e.g., https://mastodon.sdf.org/@icm
      const m = u.pathname.match(/\/@([^/]+)/);
      if (m) return `${m[1]}@${u.hostname}`;
    }
  } catch { /* ignore */ }

  // If it looks remote but missing a dot in the domain, warn the user
  if (s.includes('@')) {
    const [, host] = s.split('@');
    if (!host.includes('.')) {
      throw new Error(`That looks like a remote handle, but the domain is incomplete: “@${s}”. Did you mean “@${s}.org”?`);
    }
  }
  return s;
}


function buildPhotosQuery(countDefault = 7) {
  const raw = (queryInput?.value || '').trim();
  const count = Math.max(1, Math.min(40, Number(countInput?.value) || countDefault));

  const qs = new URLSearchParams({ limit: String(count) });

  if (!raw) {
    // No query: let backend defaults apply
    return qs.toString();
  }

  try {
    if (raw.startsWith('#')) {
      qs.set('type', 'tag');
      qs.set('tag', raw.slice(1));
      return qs.toString();
    }

    if (raw.startsWith('@')) {
      const acct = normalizeAcctInput(raw);  // <- throws on invalid
      qs.set('type', 'user');
      qs.set('acct', acct);
      return qs.toString();
    }

    alert('Please enter either a tag, starting with #, or a user, starting with @');
    return null;
  } catch (e) {
    alert(e.message || 'Invalid query');
    // optional: return focus to the field
    if (queryInput) queryInput.focus();
    return null;
  }
}

async function fetchAndDisplayImages(defaultCount = 7) {
  setLoading(true);
  grid.innerHTML = '';
  if (empty) empty.hidden = true;

  try {
    const qs = buildPhotosQuery(defaultCount);
    if (qs == null) return; // abort quietly after alert
    const photos = await getJSON('/api/photos?' + qs);

    const normalized = Array.isArray(photos)
      ? photos.map(x => (typeof x === 'string' ? { url: x, created_at: null, tags: [] } : x))
      : [];

    renderPhotos(normalized);
  } catch (err) {
    console.error('Error fetching images:', err);
    grid.innerHTML = `<p class="error">Failed to load photos.</p>`;
  } finally {
    setLoading(false);
  }
}

// ===== Wire up events =====
loginBtn  && loginBtn.addEventListener('click', login);
logoutBtn && logoutBtn.addEventListener('click', logout);
loadBtn   && loadBtn.addEventListener('click', () => fetchAndDisplayImages());
queryInput && queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    fetchAndDisplayImages();
  }
});

// ===== Launch =====
setLoading(false);
checkAuth();
