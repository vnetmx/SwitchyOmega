const app = document.getElementById('app');

function esc(s) {
  const d = document.createElement('div');
  d.textContent = String(s == null ? '' : s);
  return d.innerHTML;
}

async function init() {
  app.innerHTML = '<div class="loading">Connecting…</div>';

  // Simple direct sendMessage test with timeout
  let options;
  try {
    options = await sendWithTimeout({ method: 'getAll', args: [] }, 5000);
  } catch (e) {
    app.innerHTML = `<div class="error">
      <p>Cannot connect to background</p>
      <p class="detail">${esc(e.message || JSON.stringify(e))}</p>
    </div>`;
    return;
  }

  if (options.error) {
    app.innerHTML = `<div class="error">
      <p>Background error</p>
      <p class="detail">${esc(options.error.message || options.error.reason || JSON.stringify(options.error))}</p>
    </div>`;
    return;
  }

  const data = options.result || options;
  renderProfiles(data);
}

function sendWithTimeout(msg, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout — service worker not responding')), ms);
    chrome.runtime.sendMessage(msg, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(response);
    });
  });
}

function renderProfiles(options) {
  const current = getCurrentProfile(options);
  const profiles = [];

  for (const key of Object.keys(options).sort()) {
    if (key[0] !== '+') continue;
    const p = options[key];
    if (!p || !p.name || p.name.startsWith('__')) continue;
    profiles.push(p);
  }

  const builtins = [
    { name: 'direct', color: '#aaaaaa' },
    { name: 'system', color: '#000000' },
  ];

  let html = '<ul class="profile-list">';

  for (const p of builtins) {
    const active = current === p.name ? ' active' : '';
    const label = chrome.i18n.getMessage('profile_' + p.name) || p.name;
    html += `<li class="profile-item${active}" data-name="${esc(p.name)}">
      <span class="profile-dot" style="background:${esc(p.color)}"></span>
      <span class="profile-name">${esc(label)}</span>
    </li>`;
  }

  if (profiles.length) html += '<li class="divider"></li>';

  for (const p of profiles) {
    const active = current === p.name ? ' active' : '';
    html += `<li class="profile-item${active}" data-name="${esc(p.name)}">
      <span class="profile-dot" style="background:${esc(p.color || '#99ccee')}"></span>
      <span class="profile-name">${esc(p.name)}</span>
    </li>`;
  }

  html += '<li class="divider"></li>';
  html += `<li class="action-item" id="open-options">
    <span class="icon">⚙</span>
    <span>${chrome.i18n.getMessage('popup_openOptions') || 'Options'}</span>
  </li>`;
  html += '</ul>';

  app.innerHTML = html;

  app.querySelectorAll('.profile-item').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.dataset.name;
      chrome.runtime.sendMessage({ method: 'applyProfile', args: [name], noReply: true, refreshActivePage: true });
      app.querySelectorAll('.profile-item').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      setTimeout(() => window.close(), 200);
    });
  });

  document.getElementById('open-options')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    window.close();
  });
}

function getCurrentProfile(options) {
  // Try to find the current profile name from the options
  for (const key of Object.keys(options)) {
    if (key.startsWith('-') && key === '-currentProfileName') return options[key];
  }
  return '';
}

init();
