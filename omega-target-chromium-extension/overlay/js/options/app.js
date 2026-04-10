import { getAll, patchOptions, resetOptions, applyProfile, tr, getState, setState } from '../backend.js';
import { renderGeneral } from './pages/general.js';
import { renderIO } from './pages/io.js';
import { renderAbout } from './pages/about.js';
import { renderProfile } from './pages/profiles.js';
import { showModal, hideModal, esc } from './ui.js';

let options = null;
let originalOptions = null;
let dirty = false;

const content = document.getElementById('content');
const profileNav = document.getElementById('profile-nav');
const btnApply = document.getElementById('btn-apply');
const btnDiscard = document.getElementById('btn-discard');

// --- Init ---
async function init() {
  try {
    options = await getAll();
    originalOptions = JSON.parse(JSON.stringify(options));
    dirty = false;
    updateDirtyState();
    buildNav();
    navigate(location.hash || '#general');
  } catch (e) {
    content.innerHTML = `<div class="alert alert-danger">Failed to load options: ${esc(e.message)}</div>`;
  }
}

// --- Navigation ---
function buildNav() {
  let html = '';
  const profiles = getProfiles();
  for (const p of profiles) {
    html += `<div class="nav-profile-item">
      <a href="#profile/${esc(p.name)}" class="nav-item" data-page="profile" data-name="${esc(p.name)}">
        <span class="profile-dot-nav" style="background:${esc(p.color || '#99ccee')}"></span>
        ${esc(tr('profile_' + p.name) || p.name)}
      </a>
      <span class="nav-delete" data-name="${esc(p.name)}" title="Delete">✕</span>
    </div>`;
  }
  profileNav.innerHTML = html;

  profileNav.querySelectorAll('.nav-delete').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteProfile(el.dataset.name);
    });
  });
}

function navigate(hash) {
  const parts = hash.replace('#', '').split('/');
  const page = parts[0] || 'general';
  const param = decodeURIComponent(parts.slice(1).join('/'));

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(el => {
    const elPage = el.dataset.page;
    const elName = el.dataset.name;
    el.classList.toggle('active',
      (elPage === page && (!elName || elName === param)));
  });

  switch (page) {
    case 'general': renderGeneral(content, options, markDirty); break;
    case 'io': renderIO(content, options, reloadOptions); break;
    case 'about': renderAbout(content); break;
    case 'profile':
      if (param) renderProfile(content, options, param, markDirty);
      else navigate('#general');
      break;
    default: renderGeneral(content, options, markDirty);
  }
}

window.addEventListener('hashchange', () => navigate(location.hash));

// --- Dirty state ---
function markDirty() {
  dirty = true;
  updateDirtyState();
}

function updateDirtyState() {
  btnApply.disabled = !dirty;
  btnDiscard.disabled = !dirty;
}

// --- Apply / Discard ---
btnApply.addEventListener('click', async () => {
  if (!dirty) return;
  try {
    btnApply.textContent = 'Applying…';
    btnApply.disabled = true;
    const patch = buildPatch(originalOptions, options);
    options = await patchOptions(patch);
    originalOptions = JSON.parse(JSON.stringify(options));
    dirty = false;
    updateDirtyState();
    btnApply.textContent = '✓ Apply changes';
    buildNav();
  } catch (e) {
    btnApply.textContent = '✓ Apply changes';
    alert('Failed to apply: ' + e.message);
  }
});

btnDiscard.addEventListener('click', () => {
  if (!dirty) return;
  options = JSON.parse(JSON.stringify(originalOptions));
  dirty = false;
  updateDirtyState();
  buildNav();
  navigate(location.hash || '#general');
});

// --- Add profile ---
document.getElementById('add-profile').addEventListener('click', (e) => {
  e.preventDefault();
  showNewProfileModal();
});

function showNewProfileModal() {
  const types = [
    { value: 'FixedProfile', label: 'Proxy Profile' },
    { value: 'SwitchProfile', label: 'Switch Profile (Auto Switch)' },
    { value: 'PacProfile', label: 'PAC Profile' },
    { value: 'RuleListProfile', label: 'Rule List Profile' },
  ];

  const colors = ['#99ccee', '#99dd99', '#ffcc99', '#ffaaaa', '#cc99ff', '#aadddd'];
  const color = colors[Object.keys(options).filter(k => k[0] === '+').length % colors.length];

  showModal(`
    <h3>New Profile</h3>
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="modal-name" placeholder="Profile name" autofocus>
    </div>
    <div class="form-group">
      <label>Type</label>
      <select id="modal-type">
        ${types.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Color</label>
      <input type="color" id="modal-color" value="${color}">
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-create">Create</button>
    </div>
  `);

  document.getElementById('modal-cancel').onclick = hideModal;
  document.getElementById('modal-create').onclick = () => {
    const name = document.getElementById('modal-name').value.trim();
    const type = document.getElementById('modal-type').value;
    const clr = document.getElementById('modal-color').value;
    if (!name) return;
    createProfile(name, type, clr);
    hideModal();
  };
}

function createProfile(name, type, color) {
  const key = '+' + name;
  if (options[key]) { alert('Profile already exists'); return; }

  const profile = { name, profileType: type, color };

  if (type === 'FixedProfile') {
    profile.fallbackProxy = { scheme: 'http', host: '', port: 8080 };
    profile.bypassList = [
      { pattern: '127.0.0.1', conditionType: 'BypassCondition' },
      { pattern: '::1', conditionType: 'BypassCondition' },
      { pattern: 'localhost', conditionType: 'BypassCondition' },
    ];
  } else if (type === 'SwitchProfile') {
    profile.rules = [];
    profile.defaultProfileName = 'direct';
  } else if (type === 'PacProfile') {
    profile.pacUrl = '';
    profile.pacScript = 'function FindProxyForURL(url, host) {\n  return "DIRECT";\n}';
  } else if (type === 'RuleListProfile') {
    profile.sourceUrl = '';
    profile.ruleList = '';
    profile.matchProfileName = 'direct';
    profile.defaultProfileName = 'direct';
  }

  options[key] = profile;
  markDirty();
  buildNav();
  location.hash = '#profile/' + encodeURIComponent(name);
}

function deleteProfile(name) {
  if (!confirm(`Delete profile "${name}"?`)) return;
  delete options['+' + name];
  markDirty();
  buildNav();
  navigate('#general');
}

async function reloadOptions() {
  options = await getAll();
  originalOptions = JSON.parse(JSON.stringify(options));
  dirty = false;
  updateDirtyState();
  buildNav();
  navigate(location.hash || '#general');
}

// --- Helpers ---
export function getProfiles() {
  return Object.keys(options)
    .filter(k => k[0] === '+' && options[k] && options[k].name && !options[k].name.startsWith('__'))
    .sort()
    .map(k => options[k]);
}

function buildPatch(original, current) {
  // Simple diff: return current state as the patch
  return current;
}

// --- Start ---
init();
