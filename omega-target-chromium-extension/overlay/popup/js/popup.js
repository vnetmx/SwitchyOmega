import { getAll, getState, applyProfile, tr, getPageInfo, callBackgroundNoReply } from '../js/backend.js';

const app = document.getElementById('app');

async function init() {
  try {
    const [options, state] = await Promise.all([
      getAll(),
      getState({
        currentProfileName: '',
        proxyNotControllable: null,
        validResultProfiles: null,
        isSystemProfile: false,
        showExternalProfile: true,
      })
    ]);

    if (state.proxyNotControllable) {
      renderNotControllable(state.proxyNotControllable);
      return;
    }

    renderProfiles(options, state);
  } catch (e) {
    app.innerHTML = `<div class="error">
      <p>${tr('popup_errorConnecting') || 'Cannot connect to background.'}</p>
      <p class="detail">${e.message}</p>
    </div>`;
  }
}

function renderNotControllable(reason) {
  const msg = reason === 'policy'
    ? (tr('popup_proxyNotControllablePolicy') || 'Proxy controlled by policy')
    : (tr('popup_proxyNotControllableApp') || 'Proxy controlled by another extension');
  app.innerHTML = `<div class="notice">${msg}</div>`;
}

function renderProfiles(options, state) {
  const current = state.currentProfileName;
  const profiles = [];

  // Collect profiles in display order
  for (const key of Object.keys(options).sort()) {
    if (key[0] !== '+') continue;
    const p = options[key];
    if (!p || !p.name) continue;
    if (p.name.startsWith('__')) continue; // hidden profiles
    profiles.push(p);
  }

  // Builtin profiles first
  const builtins = [
    { name: 'direct', profileType: 'DirectProfile', color: '#aaaaaa' },
    { name: 'system', profileType: 'SystemProfile', color: '#000000' },
  ];

  let html = '<ul class="profile-list">';

  for (const p of builtins) {
    const active = current === p.name ? ' active' : '';
    const label = tr('profile_' + p.name) || p.name;
    html += `<li class="profile-item${active}" data-name="${esc(p.name)}">
      <span class="profile-dot" style="background:${esc(p.color)}"></span>
      <span class="profile-name">${esc(label)}</span>
    </li>`;
  }

  html += '<li class="divider"></li>';

  for (const p of profiles) {
    const active = current === p.name ? ' active' : '';
    const label = tr('profile_' + p.name) || p.name;
    html += `<li class="profile-item${active}" data-name="${esc(p.name)}">
      <span class="profile-dot" style="background:${esc(p.color || '#99ccee')}"></span>
      <span class="profile-name">${esc(label)}</span>
    </li>`;
  }

  html += '<li class="divider"></li>';
  html += `<li class="action-item" id="open-options">
    <span class="icon">⚙</span>
    <span>${tr('popup_openOptions') || 'Options'}</span>
  </li>`;
  html += '</ul>';

  app.innerHTML = html;

  // Event handlers
  app.querySelectorAll('.profile-item').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.dataset.name;
      applyProfile(name);
      // Update active state immediately
      app.querySelectorAll('.profile-item').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      setTimeout(() => window.close(), 150);
    });
  });

  document.getElementById('open-options').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    window.close();
  });
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

init();
