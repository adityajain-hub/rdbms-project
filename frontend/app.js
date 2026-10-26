/**
 * =====================================================================
 * CAMPUS LOST AND FOUND - DESKTOP DASHBOARD SCRIPT
 * RDBMS Lab Project (CSC2131) - Manipal University Jaipur
 * Clean Desktop Utility: Real Product Images + Flat Matte Badges (No Glow)
 * =====================================================================
 */

// 1. RICH CAMPUS SAMPLE DATASET WITH REAL PRODUCT PHOTOGRAPHS
const SAMPLE_CATEGORIES = [
  {
    category_id: 1,
    category_name: 'Electronics & Gadgets',
    svg: `<svg class="nav-icon" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    default_img: 'images/laptop.jpg'
  },
  {
    category_id: 2,
    category_name: 'College ID & Documents',
    svg: `<svg class="nav-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg>`,
    default_img: 'images/id_card.jpg'
  },
  {
    category_id: 3,
    category_name: 'Wallets & Bags',
    svg: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="16" cy="14" r="1"/></svg>`,
    default_img: 'images/wallet.jpg'
  },
  {
    category_id: 4,
    category_name: 'Keys & Access Cards',
    svg: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="m21 2-2 2m-1.5 1.5L14 9l-2-2-4 4 2 2-4 4-2-2-2 2 4 4 11-11z"/><circle cx="7.5" cy="7.5" r="3.5"/></svg>`,
    default_img: 'images/keys.jpg'
  },
  {
    category_id: 5,
    category_name: 'Books & Stationery',
    svg: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    default_img: 'images/calculator.jpg'
  },
  {
    category_id: 6,
    category_name: 'Personal Belongings & Attire',
    svg: `<svg class="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7.35-3.83A2 2 0 0 1 9.83 1h4.34a2 2 0 0 1 2 1.82l.35 3.83"/></svg>`,
    default_img: 'images/sunglasses.jpg'
  }
];

// STATE VARIABLES
const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
  ? ''
  : 'http://127.0.0.1:5000';

let currentUser = JSON.parse(localStorage.getItem('campus_auth_user')) || {
  user_id: 1,
  full_name: 'Aditya',
  email: 'aditya.2502052853@muj.maipal.edu',
  phone: '9829012345',
  role: 'ADMIN'
};

let selectedPhotoFile = null;
let selectedPhotoDataUrl = null;

let allItems = [];
let allClaims = [];
let categories = JSON.parse(JSON.stringify(SAMPLE_CATEGORIES));
let selectedItemId = parseInt(localStorage.getItem('campus_selected_item_id')) || null;
let currentFilter = '';
let currentCategoryFilter = '';
let isLiveApi = false;
let isAdminViewActive = false;
let isRecordsViewActive = false;
let currentRecordsSubTab = 'resolved';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateAuthUI();
  initApp();

  document.getElementById('searchInput').addEventListener('input', (e) => {
    if (isRecordsViewActive) {
      filterLogsTable(e.target.value);
    } else {
      renderGrid(e.target.value.toLowerCase());
    }
  });

  const overlay = document.getElementById('loginOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLoginModal();
    });
  }
});

// AUTHENTICATION & ROLE-BASED ACCESS CONTROL
function updateAuthUI() {
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const claimsNav = document.getElementById('adminClaimsNavItem');

  if (avatarEl) avatarEl.innerText = (currentUser.full_name || 'U').charAt(0).toUpperCase();
  if (nameEl) nameEl.innerText = currentUser.full_name;
  if (roleEl) {
    roleEl.innerText = currentUser.role;
    roleEl.className = 'user-role ' + (currentUser.role === 'ADMIN' ? 'badge-admin' : 'badge-student');
  }
  if (claimsNav) {
    claimsNav.style.display = (currentUser.role === 'ADMIN') ? 'flex' : 'none';
  }
}

function openLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  const errMsg = document.getElementById('loginErrorMsg');
  if (errMsg) errMsg.style.display = 'none';
  if (overlay) overlay.classList.add('active');
}

function closeLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.classList.remove('active');
}

function switchAuthTab(tab) {
  const tabSignIn = document.getElementById('tabBtnSignIn');
  const tabSignUp = document.getElementById('tabBtnSignUp');
  const signInSec = document.getElementById('signInSection');
  const signUpSec = document.getElementById('signUpSection');
  const errEl = document.getElementById('loginErrorMsg');
  if (errEl) errEl.style.display = 'none';

  if (tab === 'signup') {
    if (tabSignIn) tabSignIn.classList.remove('active');
    if (tabSignUp) tabSignUp.classList.add('active');
    if (signInSec) signInSec.style.display = 'none';
    if (signUpSec) signUpSec.style.display = 'block';
  } else {
    if (tabSignUp) tabSignUp.classList.remove('active');
    if (tabSignIn) tabSignIn.classList.add('active');
    if (signUpSec) signUpSec.style.display = 'none';
    if (signInSec) signInSec.style.display = 'block';
  }
}

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  await performLogin(email, password);
}

async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();
  const full_name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const role = document.getElementById('regRole').value;

  const errEl = document.getElementById('loginErrorMsg');
  if (errEl) errEl.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, phone, password, role })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
      if (selectedItemId) {
        localStorage.setItem('campus_selected_item_id', selectedItemId);
      }
      closeLoginModal();
      window.location.reload();
      return;
    } else {
      showLoginError(data.message || 'Registration failed. Please check inputs.');
    }
  } catch (err) {
    currentUser = {
      user_id: Date.now(),
      full_name: full_name,
      email: email,
      phone: phone || '9829000000',
      role: role || 'STUDENT'
    };
    localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
    if (selectedItemId) localStorage.setItem('campus_selected_item_id', selectedItemId);
    closeLoginModal();
    window.location.reload();
  }
}

async function quickLogin(email, password) {
  switchAuthTab('signin');
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  await performLogin(email, password);
}

async function performLogin(email, password) {
  const errEl = document.getElementById('loginErrorMsg');
  if (errEl) errEl.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
      if (selectedItemId) {
        localStorage.setItem('campus_selected_item_id', selectedItemId);
      }
      closeLoginModal();
      window.location.reload();
      return;
    } else {
      showLoginError(data.message || 'Invalid email or password.');
    }
  } catch (err) {
    // Offline / fallback auth
    if (email.toLowerCase().includes('aditya') && password === 'adi@123') {
      currentUser = {
        user_id: 1,
        full_name: 'Aditya',
        email: email,
        phone: '9829012345',
        role: 'ADMIN'
      };
      localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
      if (selectedItemId) localStorage.setItem('campus_selected_item_id', selectedItemId);
      closeLoginModal();
      window.location.reload();
      return;
    } else if (password === 'student@123' || email.toLowerCase().includes('aarav')) {
      currentUser = {
        user_id: 2,
        full_name: 'Aarav Sharma',
        email: email,
        phone: '9829012346',
        role: 'STUDENT'
      };
      localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
      if (selectedItemId) localStorage.setItem('campus_selected_item_id', selectedItemId);
      closeLoginModal();
      window.location.reload();
      return;
    } else {
      showLoginError('Connection failed or incorrect credentials.');
    }
  }
}

function showLoginError(msg) {
  const errEl = document.getElementById('loginErrorMsg');
  if (errEl) {
    errEl.innerText = msg;
    errEl.style.display = 'block';
  }
}

function logoutUser(e) {
  if (e) e.stopPropagation();
  openLoginModal();
}

// PHOTO ATTACHMENT HANDLERS
function handlePhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedPhotoFile = file;

  const reader = new FileReader();
  reader.onload = function(e) {
    selectedPhotoDataUrl = e.target.result;
    const previewWrap = document.getElementById('photoPreviewWrap');
    const previewImg = document.getElementById('photoPreviewImg');
    const promptText = document.getElementById('photoPromptText');
    if (previewImg) previewImg.src = selectedPhotoDataUrl;
    if (previewWrap) previewWrap.style.display = 'block';
    if (promptText) promptText.innerText = file.name;
  };
  reader.readAsDataURL(file);
}

function removeSelectedPhoto(event) {
  if (event) event.stopPropagation();
  selectedPhotoFile = null;
  selectedPhotoDataUrl = null;
  const input = document.getElementById('itemPhotoInput');
  if (input) input.value = '';
  const previewWrap = document.getElementById('photoPreviewWrap');
  if (previewWrap) previewWrap.style.display = 'none';
  const promptText = document.getElementById('photoPromptText');
  if (promptText) promptText.innerText = 'Click to select photo from device';
}

// THEME SWITCHER (DARK & LIGHT MODE) WITH SVG ICONS
function initTheme() {
  const savedTheme = localStorage.getItem('campus_theme') || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('campus_theme', theme);

  const iconEl = document.getElementById('themeIcon');
  const textEl = document.getElementById('themeText');
  const toggleBtn = document.getElementById('themeToggleBtn');

  if (theme === 'light') {
    if (iconEl) {
      iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    }
    if (textEl) textEl.innerText = 'Light';
    if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Dark Mode');
  } else {
    if (iconEl) {
      iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    }
    if (textEl) textEl.innerText = 'Dark';
    if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Light Mode');
  }
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

async function initApp() {
  await loadCategories();
  await syncCurrentUser();
  await loadClaims();
  await loadItems();
  await loadStats();
}

async function syncCurrentUser() {
  if (!currentUser || !isLiveApi) return;
  try {
    const res = await fetch(`${API_BASE}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.user_id,
        email: currentUser.email || '',
        full_name: currentUser.full_name || ''
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
        updateAuthUI();
      }
    }
  } catch (e) {
    console.warn('User sync failed:', e);
  }
}

async function loadClaims() {
  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/claims`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          allClaims = data;
        }
      }
    } catch (e) {
      console.warn('Failed to load claims:', e);
    }
  }
}

// 1. Fetch Categories
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        categories = data;
        isLiveApi = true;
      }
    } else {
      isLiveApi = false;
    }
  } catch (e) {
    isLiveApi = false;
  }

  // Update Status Pill
  const statusEl = document.getElementById('dbStatus');
  if (statusEl) {
    if (isLiveApi) {
      statusEl.innerText = 'Connected (Live API)';
      statusEl.style.color = 'var(--accent-green)';
    } else {
      statusEl.innerText = 'Offline (Start: python app.py)';
      statusEl.style.color = 'var(--accent-amber)';
    }
  }

  // Populate Sidebar Categories with clean SVG line icons
  const list = document.getElementById('categoryNavList');
  if (list) {
    list.innerHTML = '';
    categories.forEach(c => {
      const matched = SAMPLE_CATEGORIES.find(sc => sc.category_id === c.category_id);
      const svgIcon = (matched && matched.svg) ? matched.svg : `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
      
      list.innerHTML += `
        <div class="nav-item" onclick="setCategoryFilter(${c.category_id}, this)">
          ${svgIcon}
          <span>${c.category_name}</span>
        </div>
      `;
    });
  }
}

// 2. Fetch Stats
async function loadStats() {
  let stats = null;
  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) stats = await res.json();
    } catch (e) {
      stats = null;
    }
  }

  const activeItemsCount = allItems.filter(i => i.status !== 'RESOLVED').length;
  const activeLostCount = allItems.filter(i => i.report_type === 'LOST' && i.status !== 'RESOLVED').length;
  const activeFoundCount = allItems.filter(i => i.report_type === 'FOUND' && i.status !== 'RESOLVED').length;
  const resolvedItemsCount = allItems.filter(i => i.status === 'RESOLVED').length;
  const pendingClaimsCount = allClaims.filter(c => c.status === 'PENDING').length;

  document.getElementById('barTotal').innerText = stats ? (stats.total_items || allItems.length) : allItems.length;
  document.getElementById('barLost').innerText = (stats && stats.total_lost !== undefined) ? stats.total_lost : activeLostCount;
  document.getElementById('barFound').innerText = (stats && stats.total_found !== undefined) ? stats.total_found : activeFoundCount;
  document.getElementById('barResolved').innerText = (stats && stats.total_resolved !== undefined) ? stats.total_resolved : resolvedItemsCount;

  document.getElementById('countAll').innerText = activeItemsCount;
  document.getElementById('countLost').innerText = activeLostCount;
  document.getElementById('countFound').innerText = activeFoundCount;
  const countRecordsEl = document.getElementById('countRecords');
  if (countRecordsEl) countRecordsEl.innerText = resolvedItemsCount;
  document.getElementById('countClaims').innerText = pendingClaimsCount;

  // Update status pill to clearly show MySQL vs SQLite mode
  const statusEl = document.getElementById('dbStatus');
  if (statusEl && isLiveApi) {
    if (stats.db_mode === 'MYSQL') {
      statusEl.innerText = 'MySQL 8.0 (Live DB)';
      statusEl.style.color = 'var(--accent-green)';
      statusEl.title = 'Connected to MySQL server: campus_lost_and_found database';
    } else {
      statusEl.innerText = 'SQLite Demo (Set MySQL pwd in app.py)';
      statusEl.style.color = 'var(--accent-amber)';
      statusEl.title = 'Running on SQLite demo fallback. Update DB_CONFIG password in backend/app.py to connect to MySQL';
    }
  }
}

// 3. Fetch Items
async function loadItems() {
  if (isLiveApi) {
    let url = `${API_BASE}/api/items`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          allItems = data.map(i => {
            const cat = SAMPLE_CATEGORIES.find(sc => sc.category_id === i.category_id);
            return {
              ...i,
              image: i.image_url || i.image || (cat ? cat.default_img : 'images/laptop.jpg')
            };
          });
        }
      }
    } catch (e) {
      console.warn('API error, using local items:', e);
    }
  }

  if (isRecordsViewActive) {
    renderRecordsContent();
    return;
  }

  renderGrid();

  const activeItems = allItems.filter(i => i.status !== 'RESOLVED');
  if (activeItems.length > 0 && !isAdminViewActive) {
    const target = activeItems.find(i => i.item_id === selectedItemId) || activeItems[0];
    selectItem(target.item_id);
  } else if (!isAdminViewActive && activeItems.length === 0) {
    document.getElementById('inspectorHeaderTitle').innerText = 'ALL CLEAR';
    document.getElementById('inspectorHeaderSub').innerText = 'No active listings';
    document.getElementById('inspectorBody').innerHTML = `
      <p style="color: var(--text-dim); font-size: 0.84rem; text-align: center; margin-top: 40px; line-height: 1.6;">
        All reported belongings have been recovered or resolved!<br><br>
        Click <b>Records</b> in the left navigation to view the archive of resolved items and live system audit logs.
      </p>
    `;
  }
}

// 4. Render Center Grid (Excludes Resolved Items From All Active Sections!)
function renderGrid(searchTerm = '') {
  if (isAdminViewActive || isRecordsViewActive) return;

  const deck = document.getElementById('itemsDeck');
  deck.className = 'items-grid';
  deck.innerHTML = '';

  // Exclude resolved items from All Belongings, Lost Items, Found Items, and Categories
  let filtered = allItems.filter(i => i.status !== 'RESOLVED');

  if (currentFilter) {
    filtered = filtered.filter(i => i.report_type === currentFilter);
  }
  if (currentCategoryFilter) {
    filtered = filtered.filter(i => i.category_name === currentCategoryFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter(i => 
      (i.title && i.title.toLowerCase().includes(searchTerm)) || 
      (i.location && i.location.toLowerCase().includes(searchTerm)) ||
      (i.description && i.description.toLowerCase().includes(searchTerm)) ||
      (i.category_name && i.category_name.toLowerCase().includes(searchTerm))
    );
  }

  if (filtered.length === 0) {
    deck.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 60px 20px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; opacity:0.6;"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        <div style="font-weight:600; font-size:0.95rem; margin-bottom:6px; color:var(--text-main);">No Active Belongings</div>
        <div style="font-size:0.82rem;">Resolved items are stored in the <b>Records</b> section.<br>Click <b>+ Report New Item</b> in the sidebar to post a new listing.</div>
      </div>`;
    return;
  }

  filtered.forEach(item => {
    const isLost = item.report_type === 'LOST';
    const tagClass = isLost ? 'tag-lost' : 'tag-found';
    const isSelected = item.item_id === selectedItemId ? 'selected' : '';
    const dateFormatted = formatDateStr(item.date_incident, true);
    const imgSrc = item.image_url || item.image || 'images/laptop.jpg';

    deck.innerHTML += `
      <div class="item-key ${isSelected}" onclick="selectItem(${item.item_id})">
        <div class="key-header">
          <span class="key-tag ${tagClass}">${item.report_type}</span>
          <span class="key-status ${item.status === 'CLAIM_PENDING' ? 'status-pending' : ''}">${item.status}</span>
        </div>
        <div class="key-thumb-wrap">
          <img src="${imgSrc}" alt="${item.title}" class="key-thumb" loading="lazy">
        </div>
        <div class="key-body">
          <div class="key-title" title="${item.title}">${item.title}</div>
        </div>
        <div class="key-footer">
          <span>${item.location}</span>
          <span>${dateFormatted}</span>
        </div>
      </div>
    `;
  });
}

function formatDateStr(str, short = false) {
  if (!str) return '';
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString().split('T')[0];
      return short ? iso.substring(5) : iso;
    }
  } catch (e) {}
  return short ? str.substring(0, 10).substring(5) : str.substring(0, 10);
}

// 5. Select Item & Show Full Photo in Right Inspector
function selectItem(itemId) {
  isAdminViewActive = false;
  isRecordsViewActive = false;
  selectedItemId = itemId;
  try {
    localStorage.setItem('campus_selected_item_id', itemId);
  } catch (e) {}
  const item = allItems.find(i => i.item_id === itemId);
  if (!item) return;

  document.querySelectorAll('.item-key').forEach(el => el.classList.remove('selected'));
  renderGrid(document.getElementById('searchInput').value.toLowerCase());

  document.getElementById('inspectorHeaderTitle').innerText = `INSPECT: ITEM #${item.item_id}`;
  document.getElementById('inspectorHeaderSub').innerText = item.title;

  const isFound = item.report_type === 'FOUND';
  const isResolved = item.status === 'RESOLVED';
  const isPending = item.status === 'CLAIM_PENDING';
  const imgSrc = item.image_url || item.image || 'images/laptop.jpg';

  // Permission Verification: Only the person who reported the item OR Admin can resolve / confirm handover
  const isReporter = (
    (currentUser.user_id && item.reported_by && parseInt(currentUser.user_id) === parseInt(item.reported_by)) ||
    (currentUser.email && item.reported_by_email && currentUser.email.toLowerCase() === item.reported_by_email.toLowerCase()) ||
    (currentUser.full_name && item.reported_by_name && currentUser.full_name.trim().toLowerCase() === item.reported_by_name.trim().toLowerCase())
  );
  const isAdmin = (currentUser.role === 'ADMIN') || 
                  (currentUser.email && (currentUser.email.toLowerCase() === 'aditya.2502052853@muj.maipal.edu' || currentUser.email.toLowerCase() === 'aditya.2502052853@muj.manipal.edu'));
  const canResolve = isReporter || isAdmin;

  let actionHtml = '';
  if (isFound && !isResolved && !isPending) {
    actionHtml = `
      <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
        <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">FILE OWNERSHIP CLAIM</div>
        <form id="claimForm">
          <div class="form-row">
            <label>Your Full Name</label>
            <input type="text" class="form-control" id="clName" value="${currentUser.full_name}" placeholder="e.g. Priya Patel" required>
          </div>
          <div class="form-row">
            <label>Contact Phone / Email</label>
            <input type="text" class="form-control" id="clContact" value="${currentUser.email || currentUser.phone}" placeholder="e.g. 9829023456" required>
          </div>
          <div class="form-row">
            <label>Proof of Ownership (Identifying Marks)</label>
            <textarea class="form-control" id="clProof" placeholder="Describe scratch marks, lockscreen, serial number..." required></textarea>
          </div>
          <button type="submit" class="btn-action-primary" style="margin-top: 10px;">
            Submit Ownership Claim
          </button>
        </form>
      </div>
    `;
  } else if (isPending) {
    if (canResolve) {
      actionHtml = `
        <div style="background: #201a14; border: 1px solid #4a341a; border-radius: 6px; padding: 12px; color: #f59e0b; font-size: 0.8rem; margin-top: 10px;">
          <div style="font-weight: 700; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
            <span>🔔</span> <span>RECOVERY / HANDOVER NOTICE PENDING</span>
          </div>
          <p style="font-size: 0.74rem; color: #fcd34d; margin: 0 0 10px 0; line-height: 1.4;">
            A campus member reported finding this item or filed an ownership claim. As the reporter / Admin, verify and confirm recovery.
          </p>
          <button type="button" class="btn-action-primary" style="background:#10b981; border-color:#059669; font-size:0.75rem; padding:8px 10px;" onclick="resolvePendingItemDirectly(${item.item_id})">
            ✅ Confirm Item Recovered (Mark Resolved)
          </button>
        </div>
      `;
    } else {
      actionHtml = `
        <div style="background: #181920; border: 1px solid #2d2e3d; border-radius: 6px; padding: 12px; color: #94a3b8; font-size: 0.8rem; margin-top: 10px;">
          <div style="font-weight: 700; margin-bottom: 4px; display:flex; align-items:center; gap:6px; color:#e2e8f0;">
            <span>🔒</span> <span>HANDOVER VERIFICATION PENDING</span>
          </div>
          <p style="font-size: 0.74rem; color: #94a3b8; margin: 0; line-height: 1.4;">
            A finder handover notice or claim has been recorded for this belonging.<br><br>
            <b>Access Restricted:</b> Only the person who reported this item (<b>${item.reported_by_name || 'Owner'}</b>) or Admin Aditya can confirm handover and mark it resolved.
          </p>
        </div>
      `;
    }
  } else if (isResolved) {
    actionHtml = `
      <div style="background: var(--tag-found-bg); border: 1px solid var(--tag-found-border); border-radius: 4px; padding: 10px; color: var(--accent-green); font-size: 0.8rem; text-align: center; margin-top: 10px;">
        Case Resolved: Returned to verified owner. Stored in Records.
      </div>
    `;
  } else if (!isFound && !isResolved) {
    const cleanPhone = (item.contact_phone || '9829000000').replace(/[^0-9]/g, '');
    let ownerDirectBtn = '';
    if (canResolve) {
      ownerDirectBtn = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
          <button type="button" class="btn-action-secondary" style="font-size: 0.75rem; width: 100%; justify-content: center; color: var(--accent-green); border-color: rgba(16,185,129,0.4);" onclick="directOwnerResolve(${item.item_id})">
            ✅ I Found / Recovered My Belonging (Mark Resolved)
          </button>
        </div>
      `;
    }

    actionHtml = `
      <div class="finder-notice-box">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-green); display: flex; align-items: center; gap: 5px;">
            <span>📢</span> <span>FOUND THIS ITEM?</span>
          </div>
          <span style="font-size: 0.68rem; color: var(--text-dim);">Direct Contact</span>
        </div>
        <p style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 10px; line-height: 1.4;">
          If you found this belonging, you can directly notify <b>${item.reported_by_name}</b> without listing it as a separate found item.
        </p>

        <!-- Direct Contact Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
          <a href="tel:${cleanPhone}" class="btn-action-secondary" style="display:flex; align-items:center; justify-content:center; gap:5px; text-decoration:none; margin:0; padding:6px 4px; font-size:0.75rem;">
            <span>📞</span> <span>Call Owner</span>
          </a>
          <a href="https://wa.me/91${cleanPhone}" target="_blank" class="btn-action-secondary" style="display:flex; align-items:center; justify-content:center; gap:5px; text-decoration:none; margin:0; padding:6px 4px; font-size:0.75rem;">
            <span>💬</span> <span>WhatsApp</span>
          </a>
        </div>

        <button type="button" class="btn-action-primary" onclick="toggleFinderNotifyForm()" style="font-size: 0.76rem; padding: 7px 10px;">
          📢 Send Handover Notice to Owner
        </button>

        <div id="finderNotifyFormWrap" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
          <form id="finderNotifyForm">
            <div class="form-row">
              <label>Your Name (Finder)</label>
              <input type="text" class="form-control" id="fnName" value="${currentUser.full_name}" placeholder="e.g. Aayush Kumar" required>
            </div>
            <div class="form-row">
              <label>Your Phone / Contact</label>
              <input type="text" class="form-control" id="fnContact" value="${currentUser.phone || currentUser.email}" placeholder="e.g. 9588036565" required>
            </div>
            <div class="form-row">
              <label>Handover Message / Where can owner collect?</label>
              <textarea class="form-control" id="fnMessage" placeholder="e.g. I found your watch near Lab 304 and submitted it to the ground floor security desk / Call me to collect." required></textarea>
            </div>
            <button type="submit" class="btn-action-primary" style="margin-top: 6px; font-size: 0.76rem;">
              Submit Handover Notice
            </button>
          </form>
        </div>
        ${ownerDirectBtn}
      </div>
    `;
  }

  const deleteActiveBtnHtml = canResolve ? `
    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-color); text-align: center;">
      <button type="button" class="btn-action-secondary" style="width: 100%; justify-content: center; color: #ef4444; border-color: rgba(239, 68, 68, 0.35); font-size: 0.73rem;" onclick="deleteItem(${item.item_id})">
        🗑️ Delete Item Record
      </button>
    </div>
  ` : '';

  const inspector = document.getElementById('inspectorBody');
  inspector.innerHTML = `
    <div class="inspector-thumb-box">
      <img src="${imgSrc}" alt="${item.title}" class="inspector-thumb-img">
    </div>

    <div class="info-display-box">
      <div><b>Category:</b> ${item.category_name}</div>
      <div><b>Location:</b> ${item.location}</div>
      <div><b>Incident Date:</b> ${formatDateStr(item.date_incident)}</div>
      <div><b>Status:</b> <span style="font-weight:600; color:${item.status === 'RESOLVED' ? '#10b981' : (item.status === 'CLAIM_PENDING' ? '#f59e0b' : '#8b5cf6')}">${item.status}</span></div>
      <div><b>Reported By:</b> ${item.reported_by_name || 'Campus Member'} (${item.contact_phone || 'Security Post'})</div>
      <div style="margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 6px;">
        <b>Description:</b><br>${item.description}
      </div>
    </div>
    ${actionHtml}
    ${deleteActiveBtnHtml}
  `;

  if (document.getElementById('claimForm')) {
    document.getElementById('claimForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        item_id: item.item_id,
        item_title: item.title,
        location: item.location,
        claimant_name: document.getElementById('clName').value,
        claimant_contact: document.getElementById('clContact').value,
        proof_details: document.getElementById('clProof').value,
        status: 'PENDING',
        image: item.image_url || item.image
      };

      if (isLiveApi) {
        try {
          const res = await fetch(`${API_BASE}/api/claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.claim_id) payload.claim_id = resData.claim_id;
          }
        } catch (err) {
          console.warn('API submission failed, recording locally:', err);
        }
      }

      payload.claim_id = payload.claim_id || (allClaims.length + 1);
      allClaims.push(payload);
      item.status = 'CLAIM_PENDING';

      alert(`Claim submitted for Item #${item.item_id}!\nItem status marked as CLAIM_PENDING awaiting Admin verification.`);
      loadStats();
      selectItem(item.item_id);
    });
  }

  if (document.getElementById('finderNotifyForm')) {
    document.getElementById('finderNotifyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        finder_name: document.getElementById('fnName').value.trim(),
        finder_contact: document.getElementById('fnContact').value.trim(),
        message: document.getElementById('fnMessage').value.trim()
      };

      if (isLiveApi) {
        try {
          const res = await fetch(`${API_BASE}/api/items/${item.item_id}/notify-found`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            alert(`Handover Notice Sent to Owner!\n\nNotice saved into MySQL database. Item #${item.item_id} status marked as CLAIM_PENDING.`);
            await loadItems();
            await loadStats();
            selectItem(item.item_id);
            return;
          }
        } catch (err) {
          console.warn('API notify-found failed, recording locally:', err);
        }
      }

      item.status = 'CLAIM_PENDING';
      allClaims.push({
        claim_id: allClaims.length + 1,
        item_id: item.item_id,
        claimant_name: payload.finder_name,
        claimant_contact: payload.finder_contact,
        proof_details: 'DIRECT HANDOVER NOTICE: ' + payload.message,
        status: 'PENDING',
        image: item.image_url || item.image
      });
      alert(`Handover Notice Sent to Owner!\n\nNotice saved into database. Item #${item.item_id} status marked as CLAIM_PENDING.`);
      loadStats();
      selectItem(item.item_id);
    });
  }
}

function toggleFinderNotifyForm() {
  const wrap = document.getElementById('finderNotifyFormWrap');
  if (wrap) {
    wrap.style.display = (wrap.style.display === 'none' || !wrap.style.display) ? 'block' : 'none';
  }
}

async function resolvePendingItemDirectly(itemId) {
  const item = allItems.find(i => i.item_id === itemId);
  if (!item) return;

  const isReporter = (
    (currentUser.user_id && item.reported_by && parseInt(currentUser.user_id) === parseInt(item.reported_by)) ||
    (currentUser.email && item.reported_by_email && currentUser.email.toLowerCase() === item.reported_by_email.toLowerCase()) ||
    (currentUser.full_name && item.reported_by_name && currentUser.full_name.trim().toLowerCase() === item.reported_by_name.trim().toLowerCase())
  );
  const isAdmin = (currentUser.role === 'ADMIN') || 
                  (currentUser.email && (currentUser.email.toLowerCase() === 'aditya.2502052853@muj.maipal.edu' || currentUser.email.toLowerCase() === 'aditya.2502052853@muj.manipal.edu'));

  if (!isAdmin && !isReporter) {
    alert('Access Denied: Only the person who reported this item or an Admin can confirm handover and resolve this record.');
    return;
  }

  let targetClaim = allClaims.find(c => c.item_id === itemId && c.status === 'PENDING');
  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/items/${itemId}/claims`);
      if (res.ok) {
        const claims = await res.json();
        const pending = claims.find(c => c.status === 'PENDING');
        if (pending) targetClaim = pending;
      }
    } catch (e) {}
  }

  if (targetClaim) {
    await executeApprove(targetClaim.claim_id);
  } else {
    await directOwnerResolve(itemId);
  }
}

async function directOwnerResolve(itemId) {
  const targetItem = allItems.find(i => i.item_id === itemId);
  if (!targetItem) return;

  const isReporter = (
    (currentUser.user_id && targetItem.reported_by && parseInt(currentUser.user_id) === parseInt(targetItem.reported_by)) ||
    (currentUser.email && targetItem.reported_by_email && currentUser.email.toLowerCase() === targetItem.reported_by_email.toLowerCase()) ||
    (currentUser.full_name && targetItem.reported_by_name && currentUser.full_name.trim().toLowerCase() === targetItem.reported_by_name.trim().toLowerCase())
  );
  const isAdmin = (currentUser.role === 'ADMIN') || 
                  (currentUser.email && (currentUser.email.toLowerCase() === 'aditya.2502052853@muj.maipal.edu' || currentUser.email.toLowerCase() === 'aditya.2502052853@muj.manipal.edu'));

  if (!isAdmin && !isReporter) {
    alert('Access Denied: Only the person who reported this item or an Admin can mark it resolved.');
    return;
  }

  if (!confirm(`Mark '${targetItem.title}' as RESOLVED / Recovered?\n\nThis will remove it from active listings and archive it in Records.`)) {
    return;
  }

  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/items/${itemId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          email: currentUser.email || '',
          full_name: currentUser.full_name || '',
          role: currentUser.role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to mark item resolved.');
        return;
      }
      if (data.user_id && currentUser.role !== 'ADMIN') {
        currentUser.user_id = data.user_id;
        localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
        updateAuthUI();
      }
    } catch (e) {
      console.warn('API call failed, updating local state:', e);
    }
  }

  targetItem.status = 'RESOLVED';
  alert(`Item #${itemId} ('${targetItem.title}') marked as RESOLVED!\n\nRemoved from active listings and archived in Records.`);
  await loadItems();
  await loadStats();
}

// 6. Show "Report New Item" Form with Image Attachment
function showNewItemForm() {
  selectedItemId = null;
  isAdminViewActive = false;
  isRecordsViewActive = false;
  const deck = document.getElementById('itemsDeck');
  if (deck) deck.className = 'items-grid';
  selectedPhotoFile = null;
  selectedPhotoDataUrl = null;
  document.querySelectorAll('.item-key').forEach(el => el.classList.remove('selected'));

  document.getElementById('inspectorHeaderTitle').innerText = 'NEW REPORT';
  document.getElementById('inspectorHeaderSub').innerText = 'Log a Lost or Found Belonging';

  let catOptions = categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');

  document.getElementById('inspectorBody').innerHTML = `
    <form id="newItemForm">
      <div class="form-row">
        <label>Report Type</label>
        <select class="form-control" id="newType">
          <option value="LOST">Lost Item</option>
          <option value="FOUND">Found Item</option>
        </select>
      </div>

      <div class="form-row">
        <label>Item Name / Title</label>
        <input type="text" class="form-control" id="newTitle" placeholder="e.g. Casio Calculator FX-991" required>
      </div>

      <div class="form-row">
        <label>Category</label>
        <select class="form-control" id="newCategory" required>
          ${catOptions}
        </select>
      </div>

      <div class="form-row">
        <label>Campus Location</label>
        <input type="text" class="form-control" id="newLocation" placeholder="e.g. Central Library 2nd Floor" required>
      </div>

      <div class="form-row">
        <label>Incident Date</label>
        <input type="date" class="form-control" id="newDate" value="${new Date().toISOString().split('T')[0]}" required>
      </div>

      <div class="form-row">
        <label>Attach Item Photograph (Optional)</label>
        <div class="file-dropzone" onclick="document.getElementById('itemPhotoInput').click()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span id="photoPromptText">Click to select photo from device</span>
        </div>
        <input type="file" id="itemPhotoInput" accept="image/*" style="display:none;" onchange="handlePhotoSelect(event)">
        <div id="photoPreviewWrap" class="preview-wrap" style="display:none;">
          <img id="photoPreviewImg" src="" alt="Selected Preview">
          <button type="button" class="btn-remove-preview" onclick="removeSelectedPhoto(event)" title="Remove photo">&times;</button>
        </div>
      </div>

      <div class="form-row">
        <label>Description</label>
        <textarea class="form-control" id="newDesc" placeholder="Provide clear identifying visual details..." required></textarea>
      </div>

      <div style="font-size:0.75rem; color:var(--text-dim); margin-bottom:8px;">
        Reporting as: <b>${currentUser.full_name}</b> (${currentUser.role})
      </div>

      <button type="submit" class="btn-action-primary" style="margin-top: 8px;">
        Save to Database
      </button>
    </form>
  `;

  document.getElementById('newItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const catId = parseInt(document.getElementById('newCategory').value);
    const catObj = categories.find(c => c.category_id === catId);
    const sampleCategory = SAMPLE_CATEGORIES.find(sc => sc.category_id === catId);

    // 1. Upload photo if selected
    let finalImageUrl = sampleCategory ? sampleCategory.default_img : 'images/laptop.jpg';

    if (selectedPhotoFile && isLiveApi) {
      try {
        const formData = new FormData();
        formData.append('image', selectedPhotoFile);
        const upRes = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          if (upData.image_url) {
            finalImageUrl = upData.image_url;
          }
        }
      } catch (upErr) {
        console.warn('Photo upload API failed, falling back:', upErr);
        if (selectedPhotoDataUrl) finalImageUrl = selectedPhotoDataUrl;
      }
    } else if (selectedPhotoDataUrl) {
      finalImageUrl = selectedPhotoDataUrl;
    }

    const newItem = {
      report_type: document.getElementById('newType').value,
      title: document.getElementById('newTitle').value,
      category_id: catId,
      category_name: catObj ? catObj.category_name : 'General Belonging',
      location: document.getElementById('newLocation').value,
      date_incident: document.getElementById('newDate').value,
      description: document.getElementById('newDesc').value,
      status: 'ACTIVE',
      reported_by: currentUser.user_id || 1,
      reported_by_name: currentUser.full_name || 'Campus Member',
      reported_by_email: currentUser.email || '',
      contact_phone: currentUser.phone || '9829012345',
      image_url: finalImageUrl,
      image: finalImageUrl
    };

    let savedToBackend = false;
    let assignedId = allItems.length ? Math.max(...allItems.map(i => i.item_id)) + 1 : 1;

    if (isLiveApi) {
      try {
        const res = await fetch(`${API_BASE}/api/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.item_id) assignedId = resData.item_id;
          if (resData.user_id) {
            currentUser.user_id = resData.user_id;
            localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
          }
          savedToBackend = true;
        } else {
          console.error('API save failed with status:', res.status, await res.text());
        }
      } catch (err) {
        console.warn('API save failed:', err);
      }
    }

    newItem.item_id = assignedId;

    if (savedToBackend) {
      // Reload directly from backend to ensure items in grid match the database
      await loadItems();
      await loadStats();
      alert(`Success! Item #${newItem.item_id} "${newItem.title}" has been saved into MySQL.`);
    } else {
      allItems.unshift(newItem);
      loadStats();
      if (isLiveApi) {
        alert(`Server error while saving Item #${newItem.item_id}. Saved in local session only.`);
      } else {
        alert(`Item #${newItem.item_id} added to local view.\n\nNote: Backend is offline. Run 'python app.py' in the backend folder to connect to MySQL / SQLite.`);
      }
    }
    
    currentFilter = '';
    currentCategoryFilter = '';
    highlightNav(document.querySelector('.nav-item'));
    document.getElementById('viewLabel').innerText = 'Showing: All Items';
    renderGrid();
    selectItem(newItem.item_id);
  });
}

// 7. Show Admin Claims View with Real Images
async function showAdminView(navEl) {
  if (currentUser.role !== 'ADMIN') {
    alert('Access Restricted: Only Admin (Aditya) can review claims and approve ownership transfers.');
    openLoginModal();
    return;
  }

  isAdminViewActive = true;
  isRecordsViewActive = false;
  selectedItemId = null;
  highlightNav(navEl);
  document.getElementById('viewLabel').innerText = 'Showing: Pending Admin Claims';
  const deck = document.getElementById('itemsDeck');
  if (deck) deck.className = 'items-grid';

  let claims = allClaims.filter(c => c.status === 'PENDING');
  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/claims`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          allClaims = data;
          claims = allClaims.filter(c => c.status === 'PENDING');
        }
      }
    } catch (e) {
      // Use fallback
    }
  }

  document.getElementById('countClaims').innerText = claims.length;
  document.getElementById('inspectorHeaderTitle').innerText = 'ADMIN CONTROL';
  document.getElementById('inspectorHeaderSub').innerText = 'Ownership Verification';

  deck.innerHTML = '';

  if (claims.length === 0) {
    deck.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--accent-green); padding: 50px;">All submitted claims have been processed! No pending claims.</div>`;
    document.getElementById('inspectorBody').innerHTML = `<p style="color:var(--text-dim); text-align:center; padding-top:40px;">No pending claims awaiting review.</p>`;
    return;
  }

  claims.forEach((c, idx) => {
    const claimItem = allItems.find(i => i.item_id === c.item_id);
    const imgSrc = c.image_url || c.image || (claimItem ? (claimItem.image_url || claimItem.image) : 'images/laptop.jpg');

    deck.innerHTML += `
      <div class="item-key ${idx === 0 ? 'selected' : ''}" onclick="inspectClaim(${c.claim_id})">
        <div class="key-header">
          <span class="key-tag tag-found">CLAIM #${c.claim_id}</span>
          <span class="key-status" style="color:var(--accent-amber)">PENDING</span>
        </div>
        <div class="key-thumb-wrap">
          <img src="${imgSrc}" alt="${c.item_title}" class="key-thumb">
        </div>
        <div class="key-body">
          <div class="key-title">${c.item_title}</div>
        </div>
        <div class="key-footer">
          <span>By: ${c.claimant_name}</span>
          <span>${c.claimant_contact}</span>
        </div>
      </div>
    `;
  });

  inspectClaim(claims[0].claim_id);
}

function inspectClaim(claimId) {
  const claim = allClaims.find(c => c.claim_id === claimId);
  if (!claim) return;

  const claimItem = allItems.find(i => i.item_id === claim.item_id);
  const imgSrc = claim.image_url || claim.image || (claimItem ? (claimItem.image_url || claimItem.image) : 'images/laptop.jpg');

  document.querySelectorAll('.item-key').forEach(el => el.classList.remove('selected'));

  document.getElementById('inspectorBody').innerHTML = `
    <div class="inspector-thumb-box">
      <img src="${imgSrc}" alt="${claim.item_title}" class="inspector-thumb-img">
    </div>

    <div class="info-display-box">
      <div><b>Target Item:</b> ${claim.item_title}</div>
      <div><b>Location Found:</b> ${claim.location}</div>
      <div><b>Claimant Name:</b> ${claim.claimant_name}</div>
      <div><b>Contact Info:</b> ${claim.claimant_contact}</div>
      <div style="margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 6px;">
        <b>Submitted Ownership Proof:</b><br>${claim.proof_details}
      </div>
    </div>

    <div style="background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:4px; padding:10px; margin-top:10px;">
      <p style="font-size:0.75rem; color:var(--text-muted); margin:0;">
        <b>Database Trigger trg_resolve_item_on_claim:</b><br>
        Approving this claim automatically updates the item's status to <b>RESOLVED</b> and logs an audit record in <code>activity_logs</code>.
      </p>
    </div>

    <button class="btn-action-primary" style="margin-top:12px;" onclick="executeApprove(${claim.claim_id})">
      Approve Claim (Fires Trigger)
    </button>
  `;
}

async function executeApprove(claimId) {
  const claim = allClaims.find(c => c.claim_id === claimId);
  const targetItem = claim ? allItems.find(i => i.item_id === claim.item_id) : null;
  
  const isReporter = targetItem && (
    (currentUser.user_id && targetItem.reported_by && parseInt(currentUser.user_id) === parseInt(targetItem.reported_by)) ||
    (currentUser.email && targetItem.reported_by_email && currentUser.email.toLowerCase() === targetItem.reported_by_email.toLowerCase()) ||
    (currentUser.full_name && targetItem.reported_by_name && currentUser.full_name.trim().toLowerCase() === targetItem.reported_by_name.trim().toLowerCase())
  );
  const isAdmin = (currentUser.role === 'ADMIN') || 
                  (currentUser.email && (currentUser.email.toLowerCase() === 'aditya.2502052853@muj.maipal.edu' || currentUser.email.toLowerCase() === 'aditya.2502052853@muj.manipal.edu'));

  if (!isAdmin && !isReporter) {
    alert('Access Denied: Only the person who reported this item or an Admin can confirm handover and resolve this record.');
    return;
  }

  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/claims/approve/${claimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          email: currentUser.email || '',
          full_name: currentUser.full_name || '',
          role: currentUser.role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Approval failed: access denied.');
        return;
      }
      if (data.user_id && currentUser.role !== 'ADMIN') {
        currentUser.user_id = data.user_id;
        localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
        updateAuthUI();
      }
    } catch (e) {
      console.warn('API call failed, updating local state:', e);
    }
  }

  if (claim) claim.status = 'APPROVED';
  if (targetItem) targetItem.status = 'RESOLVED';

  alert(`Claim / Recovery #${claimId} APPROVED & CONFIRMED!\n\nTrigger 'trg_resolve_item_on_claim' executed:\n→ Item marked as RESOLVED.\n→ Item removed from active listings and archived in Records.\n→ Audit record written to activity_logs.`);
  
  await loadItems();
  await loadStats();

  if (isAdminViewActive) {
    showAdminView(document.getElementById('adminClaimsNavItem'));
  } else if (isRecordsViewActive) {
    showRecordsView(document.getElementById('recordsNavItem'));
  } else {
    renderGrid();
  }
}

// =====================================================================
// 7. RECORDS & AUDIT SYSTEM (RESOLVED ITEMS ARCHIVE & ACTIVITY LOGS)
// =====================================================================
async function showRecordsView(el, initialSubTab = 'resolved') {
  isAdminViewActive = false;
  isRecordsViewActive = true;
  currentFilter = '';
  currentCategoryFilter = '';
  currentRecordsSubTab = initialSubTab;
  highlightNav(el || document.getElementById('recordsNavItem'));

  const viewLabel = document.getElementById('viewLabel');
  if (viewLabel) viewLabel.innerText = 'Showing: Records & Activity History';

  await renderRecordsContent();
}

async function switchRecordsSubTab(tab) {
  currentRecordsSubTab = tab;
  await renderRecordsContent();
}

async function renderRecordsContent() {
  const deck = document.getElementById('itemsDeck');
  deck.className = 'grid-scroll-area';
  const resolvedItems = allItems.filter(i => i.status === 'RESOLVED');

  let logs = [];
  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/logs`);
      if (res.ok) logs = await res.json();
    } catch (e) {
      logs = [];
    }
  }

  let bodyHtml = '';
  if (currentRecordsSubTab === 'resolved') {
    if (resolvedItems.length === 0) {
      bodyHtml = `
        <div style="text-align: center; color: var(--text-dim); padding: 50px 20px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; opacity:0.6;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <div style="font-weight:600; font-size:0.95rem; margin-bottom:6px; color:var(--text-main);">No Resolved Records Yet</div>
          <div style="font-size:0.82rem;">When an active lost or found item is verified and recovered, it will be automatically archived here.</div>
        </div>
      `;
    } else {
      bodyHtml = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px;">
          ${resolvedItems.map(item => {
            const isSelected = item.item_id === selectedItemId ? 'selected' : '';
            const imgSrc = item.image_url || item.image || 'images/laptop.jpg';
            const dateStr = formatDateStr(item.date_incident, true);
            return `
              <div class="item-key ${isSelected}" onclick="inspectResolvedItem(${item.item_id})" style="border-color: rgba(16, 185, 129, 0.4);">
                <div class="key-header">
                  <span class="key-tag tag-${item.report_type.toLowerCase()}">${item.report_type}</span>
                  <span class="key-status status-resolved">RESOLVED</span>
                </div>
                <div class="key-thumb-wrap">
                  <img src="${imgSrc}" alt="${item.title}" class="key-thumb" loading="lazy">
                </div>
                <div class="key-body">
                  <div class="key-title" title="${item.title}">${item.title}</div>
                  <div style="font-size: 0.72rem; color: var(--accent-green); margin-top: 3px;">✓ Handover Complete</div>
                </div>
                <div class="key-footer">
                  <span>${item.location}</span>
                  <span>${dateStr}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  } else {
    // Audit & Activity Logs Tab
    if (logs.length === 0) {
      bodyHtml = `
        <div style="text-align: center; color: var(--text-dim); padding: 50px 20px;">
          <div style="font-weight:600; font-size:0.95rem; margin-bottom:6px; color:var(--text-main);">No Activity Logs Recorded</div>
        </div>
      `;
    } else {
      bodyHtml = `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <input type="text" id="logFilterInput" class="search-field" placeholder="Filter audit logs by keyword or action..." oninput="filterLogsTable(this.value)" style="max-width: 320px; font-size: 0.78rem; padding: 6px 10px;">
          <span style="font-size: 0.75rem; color: var(--text-dim);">${logs.length} system audit entries recorded in MySQL</span>
        </div>
        <div class="log-table-wrap">
          <table class="log-table" id="activityLogsTable">
            <thead>
              <tr>
                <th style="width: 70px;">ID</th>
                <th style="width: 150px;">Action Type</th>
                <th>Event Details</th>
                <th style="width: 160px;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => {
                let badgeClass = 'badge-log-reported';
                if (log.action_type === 'CLAIM_APPROVED' || log.action_type === 'ITEM_RESOLVED') badgeClass = 'badge-log-approved';
                else if (log.action_type === 'FINDER_NOTIFIED') badgeClass = 'badge-log-notified';
                else if (log.action_type === 'CLAIM_SUBMITTED') badgeClass = 'badge-log-claimed';
                else if (log.action_type === 'USER_REGISTERED') badgeClass = 'badge-log-registered';

                return `
                  <tr>
                    <td style="color: var(--text-dim); font-family: monospace;">#${log.log_id}</td>
                    <td>
                      <span class="log-action-badge ${badgeClass}">${log.action_type}</span>
                    </td>
                    <td>${log.details}</td>
                    <td style="color: var(--text-muted); font-size: 0.75rem; font-family: monospace;">${log.log_time}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  deck.innerHTML = `
    <div class="records-container">
      <div class="records-subnav">
        <button type="button" class="records-subtab ${currentRecordsSubTab === 'resolved' ? 'active' : ''}" onclick="switchRecordsSubTab('resolved')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          <span>Resolved Belongings Archive (${resolvedItems.length})</span>
        </button>
        <button type="button" class="records-subtab ${currentRecordsSubTab === 'logs' ? 'active' : ''}" onclick="switchRecordsSubTab('logs')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          <span>Audit & Activity Logs (${logs.length})</span>
        </button>
      </div>
      ${bodyHtml}
    </div>
  `;

  // Update Inspector for records
  if (currentRecordsSubTab === 'resolved' && resolvedItems.length > 0) {
    inspectResolvedItem(resolvedItems[0].item_id);
  } else if (currentRecordsSubTab === 'logs') {
    document.getElementById('inspectorHeaderTitle').innerText = 'AUDIT SYSTEM';
    document.getElementById('inspectorHeaderSub').innerText = 'MySQL activity_logs';
    document.getElementById('inspectorBody').innerHTML = `
      <div class="info-display-box" style="line-height: 1.6;">
        <div style="font-weight: 700; color: var(--accent-green); margin-bottom: 6px;">DATABASE AUDIT LOGGING</div>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0 0 8px 0;">
          All life-cycle events on the portal are permanently recorded in MySQL <code>activity_logs</code> table:
        </p>
        <ul style="font-size: 0.75rem; color: var(--text-dim); padding-left: 16px; margin: 0;">
          <li><b>ITEM_REPORTED</b>: When a student/staff reports a lost or found belonging.</li>
          <li><b>FINDER_NOTIFIED</b>: Direct handover notice sent to owner without duplicate listing.</li>
          <li><b>CLAIM_SUBMITTED</b>: Proof of ownership submitted for found items.</li>
          <li><b>CLAIM_APPROVED</b>: Executed via trigger <code>trg_resolve_item_on_claim</code>.</li>
          <li><b>ITEM_RESOLVED</b>: Owner/Admin verified recovery.</li>
          <li><b>USER_REGISTERED</b>: New student/faculty account created.</li>
        </ul>
      </div>
    `;
  }
}

function filterLogsTable(keyword) {
  const kw = (keyword || '').toLowerCase();
  const rows = document.querySelectorAll('#activityLogsTable tbody tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(kw) ? '' : 'none';
  });
}

function inspectResolvedItem(itemId) {
  selectedItemId = itemId;
  const item = allItems.find(i => i.item_id === itemId);
  if (!item) return;

  document.querySelectorAll('.item-key').forEach(el => el.classList.remove('selected'));
  const card = document.querySelector(`.item-key[onclick="inspectResolvedItem(${itemId})"]`);
  if (card) card.classList.add('selected');

  document.getElementById('inspectorHeaderTitle').innerText = `RECORD: ITEM #${item.item_id}`;
  document.getElementById('inspectorHeaderSub').innerText = `${item.title} (RESOLVED)`;

  const imgSrc = item.image_url || item.image || 'images/laptop.jpg';

  const isReporter = (
    (currentUser.user_id && item.reported_by && parseInt(currentUser.user_id) === parseInt(item.reported_by)) ||
    (currentUser.email && item.reported_by_email && currentUser.email.toLowerCase() === item.reported_by_email.toLowerCase()) ||
    (currentUser.full_name && item.reported_by_name && currentUser.full_name.trim().toLowerCase() === item.reported_by_name.trim().toLowerCase())
  );
  const isAdmin = (currentUser.role === 'ADMIN') || 
                  (currentUser.email && (currentUser.email.toLowerCase() === 'aditya.2502052853@muj.maipal.edu' || currentUser.email.toLowerCase() === 'aditya.2502052853@muj.manipal.edu'));
  const canDelete = isReporter || isAdmin;

  const deleteBtnHtml = canDelete ? `
    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-color);">
      <button type="button" class="btn-action-secondary" style="width: 100%; justify-content: center; color: #ef4444; border-color: rgba(239, 68, 68, 0.4); font-size: 0.74rem;" onclick="deleteItem(${item.item_id})">
        🗑️ Delete Record from Database
      </button>
    </div>
  ` : '';

  document.getElementById('inspectorBody').innerHTML = `
    <div class="inspector-thumb-box">
      <img src="${imgSrc}" alt="${item.title}" class="inspector-thumb-img">
    </div>

    <div class="info-display-box">
      <div><b>Target Belonging:</b> ${item.title}</div>
      <div><b>Category:</b> ${item.category_name}</div>
      <div><b>Incident Location:</b> ${item.location}</div>
      <div><b>Reported By:</b> ${item.reported_by_name || 'Campus Member'}</div>
      <div><b>Report Type:</b> <span class="key-tag tag-${item.report_type.toLowerCase()}">${item.report_type}</span></div>
      <div><b>Case Status:</b> <span style="font-weight:700; color:var(--accent-green);">RESOLVED & RETURNED</span></div>
      <div style="margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 6px;">
        <b>Description:</b><br>${item.description}
      </div>
    </div>

    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 12px; margin-top: 12px; color: var(--accent-green); font-size: 0.78rem; line-height: 1.5;">
      <div style="font-weight: 700; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
        <span>✓</span> <span>VERIFIED HANDOVER ARCHIVED</span>
      </div>
      This belonging has been successfully recovered by its owner or handed over at the security desk. Archived in Records.
    </div>
    ${deleteBtnHtml}
  `;
}

async function deleteItem(itemId) {
  const item = allItems.find(i => i.item_id === itemId);
  const title = item ? item.title : `Item #${itemId}`;

  if (!confirm(`Are you sure you want to permanently delete '${title}' from the database?\n\nThis will remove the item and its claim records.`)) {
    return;
  }

  if (isLiveApi) {
    try {
      const res = await fetch(`${API_BASE}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          email: currentUser.email || '',
          full_name: currentUser.full_name || '',
          role: currentUser.role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to delete item.');
        return;
      }
    } catch (e) {
      console.warn('API delete call failed:', e);
    }
  }

  allItems = allItems.filter(i => i.item_id !== itemId);
  allClaims = allClaims.filter(c => c.item_id !== itemId);
  if (selectedItemId === itemId) {
    selectedItemId = null;
    try {
      localStorage.removeItem('campus_selected_item_id');
    } catch (e) {}
  }

  alert(`Item #${itemId} ('${title}') has been permanently deleted from the database.`);

  await loadItems();
  await loadStats();

  if (isRecordsViewActive) {
    await renderRecordsContent();
  }
}

// Navigation Filter Helpers
function setNavFilter(type, el) {
  isAdminViewActive = false;
  isRecordsViewActive = false;
  const deck = document.getElementById('itemsDeck');
  if (deck) deck.className = 'items-grid';
  currentFilter = type;
  currentCategoryFilter = '';
  highlightNav(el);
  document.getElementById('viewLabel').innerText = type ? `Showing: ${type} Items` : 'Showing: All Items';
  renderGrid();
  const activeItems = allItems.filter(i => i.status !== 'RESOLVED' && (!type || i.report_type === type));
  if (activeItems.length > 0) {
    selectItem(activeItems[0].item_id);
  }
}

function setCategoryFilter(catId, el) {
  isAdminViewActive = false;
  isRecordsViewActive = false;
  const deck = document.getElementById('itemsDeck');
  if (deck) deck.className = 'items-grid';
  const cat = categories.find(c => c.category_id === catId);
  currentCategoryFilter = cat ? cat.category_name : '';
  highlightNav(el);
  document.getElementById('viewLabel').innerText = `Category: ${currentCategoryFilter}`;
  renderGrid();
  const activeItems = allItems.filter(i => i.status !== 'RESOLVED' && i.category_name === currentCategoryFilter);
  if (activeItems.length > 0) {
    selectItem(activeItems[0].item_id);
  }
}

function highlightNav(el) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
}

// Explicit window bindings for inline HTML onclick handlers
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.logoutUser = logoutUser;
window.switchAuthTab = switchAuthTab;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.quickLogin = quickLogin;
window.showRecordsView = showRecordsView;
window.switchRecordsSubTab = switchRecordsSubTab;
window.directOwnerResolve = directOwnerResolve;
window.resolvePendingItemDirectly = resolvePendingItemDirectly;
window.toggleFinderNotifyForm = toggleFinderNotifyForm;
window.toggleTheme = toggleTheme;
window.showNewItemForm = showNewItemForm;
window.setNavFilter = setNavFilter;
window.setCategoryFilter = setCategoryFilter;
window.showAdminView = showAdminView;
window.selectItem = selectItem;
window.inspectClaim = inspectClaim;
window.inspectResolvedItem = inspectResolvedItem;
window.executeApprove = executeApprove;
window.deleteItem = deleteItem;


