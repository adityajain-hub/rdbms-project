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
let selectedItemId = null;
let currentFilter = '';
let currentCategoryFilter = '';
let isLiveApi = false;
let isAdminViewActive = false;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateAuthUI();
  initApp();

  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderGrid(e.target.value.toLowerCase());
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

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  await performLogin(email, password);
}

async function quickLogin(email, password) {
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
      updateAuthUI();
      closeLoginModal();
      if (currentUser.role !== 'ADMIN' && isAdminViewActive) {
        setNavFilter('', document.querySelector('.nav-item'));
      }
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
      updateAuthUI();
      closeLoginModal();
    } else if (password === 'student@123') {
      currentUser = {
        user_id: 2,
        full_name: 'Aarav Sharma',
        email: email,
        phone: '9829012346',
        role: 'STUDENT'
      };
      localStorage.setItem('campus_auth_user', JSON.stringify(currentUser));
      updateAuthUI();
      closeLoginModal();
      if (isAdminViewActive) setNavFilter('', document.querySelector('.nav-item'));
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
  await loadItems();
  await loadStats();
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

  if (!stats) {
    stats = {
      total_items: allItems.length,
      total_lost: allItems.filter(i => i.report_type === 'LOST').length,
      total_found: allItems.filter(i => i.report_type === 'FOUND').length,
      total_resolved: allItems.filter(i => i.status === 'RESOLVED').length
    };
  }

  const pendingClaimsCount = allClaims.filter(c => c.status === 'PENDING').length;

  document.getElementById('barTotal').innerText = stats.total_items || 0;
  document.getElementById('barLost').innerText = stats.total_lost || 0;
  document.getElementById('barFound').innerText = stats.total_found || 0;
  document.getElementById('barResolved').innerText = stats.total_resolved || 0;

  document.getElementById('countAll').innerText = stats.total_items || 0;
  document.getElementById('countLost').innerText = stats.total_lost || 0;
  document.getElementById('countFound').innerText = stats.total_found || 0;
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
    if (currentFilter) url += `?type=${currentFilter}`;
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

  renderGrid();

  if (allItems.length > 0 && !isAdminViewActive) {
    const target = allItems.find(i => i.item_id === selectedItemId) || allItems[0];
    selectItem(target.item_id);
  } else if (!isAdminViewActive) {
    document.getElementById('inspectorHeaderTitle').innerText = 'INSPECTOR';
    document.getElementById('inspectorHeaderSub').innerText = 'No item selected';
    document.getElementById('inspectorBody').innerHTML = `
      <p style="color: var(--text-dim); font-size: 0.84rem; text-align: center; margin-top: 40px; line-height: 1.6;">
        Database is active and ready.<br><br>
        Click <b>+ Report New Item</b> in the sidebar to log a new lost or found belonging.
      </p>
    `;
  }
}

// 4. Render Center Grid with Real Item Photos
function renderGrid(searchTerm = '') {
  if (isAdminViewActive) return;

  const deck = document.getElementById('itemsDeck');
  deck.innerHTML = '';

  let filtered = allItems;
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
        <div style="font-weight:600; font-size:0.95rem; margin-bottom:6px; color:var(--text-main);">No Belongings Recorded</div>
        <div style="font-size:0.82rem;">Click <b>+ Report New Item</b> in the left sidebar to insert your first record.</div>
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
          <span class="key-status ${item.status === 'RESOLVED' ? 'status-resolved' : ''}">${item.status}</span>
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
  selectedItemId = itemId;
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
    actionHtml = `
      <div style="background: #201a14; border: 1px solid #4a341a; border-radius: 4px; padding: 10px; color: #f59e0b; font-size: 0.8rem; text-align: center; margin-top: 10px;">
        Claim Submitted: Awaiting Admin Verification in Claims Panel.
      </div>
    `;
  } else if (isResolved) {
    actionHtml = `
      <div style="background: var(--tag-found-bg); border: 1px solid var(--tag-found-border); border-radius: 4px; padding: 10px; color: var(--accent-green); font-size: 0.8rem; text-align: center; margin-top: 10px;">
        Case Resolved: Returned to verified owner.
      </div>
    `;
  } else if (!isFound && !isResolved) {
    actionHtml = `
      <div style="background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 6px; padding: 12px; margin-top: 12px; text-align: center;">
        <div style="font-size: 0.74rem; font-weight: 700; color: var(--accent-red); margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 5px;">
          <span>🔍</span> <span>LOST ITEM NOTICE</span>
        </div>
        <p style="font-size: 0.73rem; color: var(--text-dim); margin: 0; line-height: 1.4;">
          This item is reported as <b>LOST</b>. If someone finds it and logs it as a <b>FOUND ITEM</b>, the <b>"FILE OWNERSHIP CLAIM"</b> button will appear on that found item.
        </p>
      </div>
    `;
  }

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
}

// 6. Show "Report New Item" Form with Image Attachment
function showNewItemForm() {
  selectedItemId = null;
  isAdminViewActive = false;
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
  selectedItemId = null;
  highlightNav(navEl);
  document.getElementById('viewLabel').innerText = 'Showing: Pending Admin Claims';

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

  const deck = document.getElementById('itemsDeck');
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
  if (currentUser.role !== 'ADMIN') {
    alert('Access Denied: Only Admin (Aditya) can approve claims.');
    return;
  }

  const claim = allClaims.find(c => c.claim_id === claimId);
  if (!claim) return;

  if (isLiveApi) {
    try {
      await fetch(`${API_BASE}/api/claims/approve/${claimId}`, { method: 'POST' });
      await loadItems();
      await loadStats();
    } catch (e) {
      console.warn('API call failed, updating local state:', e);
    }
  }

  claim.status = 'APPROVED';
  const targetItem = allItems.find(i => i.item_id === claim.item_id);
  if (targetItem) {
    targetItem.status = 'RESOLVED';
  }

  alert(`Claim #${claimId} APPROVED!\nTrigger 'trg_resolve_item_on_claim' automatically executed:\n→ Item #${claim.item_id} marked as RESOLVED.\n→ Audit record written to activity_logs.`);
  
  loadStats();
  showAdminView(document.querySelectorAll('.nav-item')[3]);
}

// Navigation Filter Helpers
function setNavFilter(type, el) {
  isAdminViewActive = false;
  currentFilter = type;
  currentCategoryFilter = '';
  highlightNav(el);
  document.getElementById('viewLabel').innerText = type ? `Showing: ${type} Items` : 'Showing: All Items';
  renderGrid();
  if (allItems.length > 0) {
    const firstMatch = allItems.find(i => !type || i.report_type === type);
    if (firstMatch) selectItem(firstMatch.item_id);
  }
}

function setCategoryFilter(catId, el) {
  isAdminViewActive = false;
  const cat = categories.find(c => c.category_id === catId);
  currentCategoryFilter = cat ? cat.category_name : '';
  highlightNav(el);
  document.getElementById('viewLabel').innerText = `Category: ${currentCategoryFilter}`;
  renderGrid();
  if (allItems.length > 0) {
    const firstMatch = allItems.find(i => i.category_name === currentCategoryFilter);
    if (firstMatch) selectItem(firstMatch.item_id);
  }
}

function highlightNav(el) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
}
