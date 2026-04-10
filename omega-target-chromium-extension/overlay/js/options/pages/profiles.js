import { esc } from '../ui.js';
import { getProfiles } from '../app.js';

const CONDITION_TYPES = [
  { value: 'HostWildcardCondition', label: 'Host wildcard', placeholder: '*.example.com' },
  { value: 'HostRegexCondition', label: 'Host regex', placeholder: '\\.example\\.com$' },
  { value: 'UrlWildcardCondition', label: 'URL wildcard', placeholder: 'http://*.example.com/*' },
  { value: 'UrlRegexCondition', label: 'URL regex', placeholder: 'https?://.*\\.example\\.com/' },
  { value: 'KeywordCondition', label: 'Keyword', placeholder: 'keyword' },
  { value: 'IpCondition', label: 'IP range (CIDR)', placeholder: '192.168.0.0/16' },
  { value: 'BypassCondition', label: 'Bypass', placeholder: 'localhost' },
];

const SCHEMES = [
  { key: 'proxyForHttp', label: 'HTTP', scheme: 'http' },
  { key: 'proxyForHttps', label: 'HTTPS', scheme: 'https' },
  { key: 'proxyForFtp', label: 'FTP', scheme: 'ftp' },
  { key: 'fallbackProxy', label: 'Default (fallback)', scheme: '' },
];

const PROXY_SCHEMES = ['http', 'https', 'socks4', 'socks5'];

export function renderProfile(container, options, profileName, markDirty) {
  const key = '+' + profileName;
  const profile = options[key];
  if (!profile) {
    container.innerHTML = `<div class="alert alert-danger">Profile "${esc(profileName)}" not found.</div>`;
    return;
  }

  switch (profile.profileType) {
    case 'FixedProfile': renderFixed(container, profile, options, markDirty); break;
    case 'SwitchProfile': renderSwitch(container, profile, options, markDirty); break;
    case 'PacProfile': renderPac(container, profile, markDirty); break;
    case 'RuleListProfile': renderRuleList(container, profile, options, markDirty); break;
    default:
      container.innerHTML = `<div class="alert alert-info">Profile type "${esc(profile.profileType)}" editor not yet implemented.</div>`;
  }
}

// === Fixed Profile ===
function renderFixed(container, profile, options, markDirty) {
  container.innerHTML = `
    <h2 class="page-title">
      <span class="color-picker-wrap">
        <input type="color" id="profile-color" value="${esc(profile.color || '#99ccee')}">
        ${esc(profile.name)}
      </span>
    </h2>
    <div class="section">
      <div class="section-title">Proxy Servers</div>
      <div id="proxy-fields"></div>
    </div>
    <div class="section">
      <div class="section-title">Bypass List</div>
      <p class="hint" style="margin-bottom:8px;">Hosts in this list will be connected to directly (no proxy). One per line.</p>
      <div class="bypass-list">
        <textarea id="bypass-list">${esc(bypassToText(profile.bypassList))}</textarea>
      </div>
    </div>
  `;

  const fields = document.getElementById('proxy-fields');
  for (const s of SCHEMES) {
    const proxy = profile[s.key] || { scheme: 'http', host: '', port: 8080 };
    fields.innerHTML += `
      <div class="proxy-grid" data-key="${s.key}">
        <label>${s.label}</label>
        <input type="text" class="proxy-host" value="${esc(proxy.host || '')}" placeholder="proxy.example.com">
        <input type="number" class="proxy-port" value="${proxy.port || 8080}" min="1" max="65535" style="width:80px;">
      </div>`;
  }

  // Events
  document.getElementById('profile-color').addEventListener('input', (e) => {
    profile.color = e.target.value;
    markDirty();
  });

  fields.querySelectorAll('.proxy-grid').forEach(row => {
    const key = row.dataset.key;
    const hostEl = row.querySelector('.proxy-host');
    const portEl = row.querySelector('.proxy-port');
    const update = () => {
      if (hostEl.value) {
        profile[key] = { scheme: 'http', host: hostEl.value, port: parseInt(portEl.value) || 8080 };
      } else {
        delete profile[key];
      }
      markDirty();
    };
    hostEl.addEventListener('input', update);
    portEl.addEventListener('input', update);
  });

  document.getElementById('bypass-list').addEventListener('input', (e) => {
    profile.bypassList = textToBypass(e.target.value);
    markDirty();
  });
}

function bypassToText(list) {
  if (!list) return '';
  return list.map(b => b.pattern || '').join('\n');
}

function textToBypass(text) {
  return text.split('\n').map(s => s.trim()).filter(Boolean).map(p => ({
    pattern: p, conditionType: 'BypassCondition'
  }));
}

// === Switch Profile ===
function renderSwitch(container, profile, options, markDirty) {
  if (!profile.rules) profile.rules = [];

  const allProfiles = [
    { name: 'direct', label: '[Direct]' },
    { name: 'system', label: '[System Proxy]' },
    ...getProfiles().filter(p => p.name !== profile.name).map(p => ({ name: p.name, label: p.name }))
  ];

  const profileOpts = allProfiles.map(p =>
    `<option value="${esc(p.name)}">${esc(p.label)}</option>`
  ).join('');

  const condOpts = CONDITION_TYPES.map(c =>
    `<option value="${esc(c.value)}">${esc(c.label)}</option>`
  ).join('');

  container.innerHTML = `
    <h2 class="page-title">
      <span class="color-picker-wrap">
        <input type="color" id="profile-color" value="${esc(profile.color || '#99dd99')}">
        ${esc(profile.name)}
      </span>
    </h2>
    <div class="section">
      <div class="section-title">Switch Rules</div>
      <table class="rule-table">
        <thead>
          <tr>
            <th style="width:30px;">⇅</th>
            <th style="width:160px;">Condition</th>
            <th>Pattern</th>
            <th style="width:160px;">Profile</th>
            <th style="width:80px;">Actions</th>
          </tr>
        </thead>
        <tbody id="rules-body"></tbody>
        <tfoot>
          <tr>
            <td colspan="5">
              <button class="btn btn-outline btn-sm" id="btn-add-rule">+ Add condition</button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Default Profile</div>
      <div class="form-group">
        <select id="default-profile">
          ${allProfiles.map(p =>
            `<option value="${esc(p.name)}" ${p.name === profile.defaultProfileName ? 'selected' : ''}>${esc(p.label)}</option>`
          ).join('')}
        </select>
        <div class="hint">Requests that don't match any rule will use this profile.</div>
      </div>
    </div>
  `;

  const tbody = document.getElementById('rules-body');

  function rebuildRulesTable() {
    tbody.innerHTML = '';
    profile.rules.forEach((rule, i) => {
      const tr = document.createElement('tr');
      const ct = rule.condition?.conditionType || 'HostWildcardCondition';
      const pat = rule.condition?.pattern || '';
      const pn = rule.profileName || 'direct';

      tr.innerHTML = `
        <td class="drag-handle">☰</td>
        <td>
          <select class="rule-type">${CONDITION_TYPES.map(c =>
            `<option value="${esc(c.value)}" ${c.value === ct ? 'selected' : ''}>${esc(c.label)}</option>`
          ).join('')}</select>
        </td>
        <td><input type="text" class="rule-pattern" value="${esc(pat)}" placeholder="${esc(getPlaceholder(ct))}"></td>
        <td>
          <select class="rule-profile">${allProfiles.map(p =>
            `<option value="${esc(p.name)}" ${p.name === pn ? 'selected' : ''}>${esc(p.label)}</option>`
          ).join('')}</select>
        </td>
        <td class="actions">
          <button class="btn btn-danger btn-sm btn-del" title="Delete">✕</button>
          <button class="btn btn-outline btn-sm btn-dup" title="Duplicate">⧉</button>
        </td>
      `;

      tr.querySelector('.rule-type').addEventListener('change', (e) => {
        rule.condition.conditionType = e.target.value;
        tr.querySelector('.rule-pattern').placeholder = getPlaceholder(e.target.value);
        markDirty();
      });
      tr.querySelector('.rule-pattern').addEventListener('input', (e) => {
        rule.condition.pattern = e.target.value;
        markDirty();
      });
      tr.querySelector('.rule-profile').addEventListener('change', (e) => {
        rule.profileName = e.target.value;
        markDirty();
      });
      tr.querySelector('.btn-del').addEventListener('click', () => {
        profile.rules.splice(i, 1);
        markDirty();
        rebuildRulesTable();
      });
      tr.querySelector('.btn-dup').addEventListener('click', () => {
        profile.rules.splice(i + 1, 0, JSON.parse(JSON.stringify(rule)));
        markDirty();
        rebuildRulesTable();
      });

      tbody.appendChild(tr);
    });
  }

  rebuildRulesTable();

  // Add rule
  document.getElementById('btn-add-rule').addEventListener('click', () => {
    profile.rules.push({
      condition: { conditionType: 'HostWildcardCondition', pattern: '' },
      profileName: profile.defaultProfileName || 'direct'
    });
    markDirty();
    rebuildRulesTable();
    // Focus the last pattern input
    const inputs = tbody.querySelectorAll('.rule-pattern');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  // Default profile
  document.getElementById('default-profile').addEventListener('change', (e) => {
    profile.defaultProfileName = e.target.value;
    markDirty();
  });

  // Color
  document.getElementById('profile-color').addEventListener('input', (e) => {
    profile.color = e.target.value;
    markDirty();
  });

  // Drag-and-drop sorting via native drag events
  enableDragSort(tbody, profile.rules, () => { markDirty(); rebuildRulesTable(); });
}

function getPlaceholder(type) {
  const ct = CONDITION_TYPES.find(c => c.value === type);
  return ct ? ct.placeholder : '';
}

function enableDragSort(tbody, array, onSort) {
  let dragIdx = null;
  tbody.addEventListener('dragstart', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    dragIdx = Array.from(tbody.children).indexOf(tr);
    tr.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  });
  tbody.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });
  tbody.addEventListener('drop', (e) => {
    e.preventDefault();
    const tr = e.target.closest('tr');
    if (!tr || dragIdx === null) return;
    const dropIdx = Array.from(tbody.children).indexOf(tr);
    if (dropIdx === dragIdx) return;
    const [item] = array.splice(dragIdx, 1);
    array.splice(dropIdx, 0, item);
    onSort();
  });
  tbody.addEventListener('dragend', (e) => {
    dragIdx = null;
    tbody.querySelectorAll('tr').forEach(tr => tr.style.opacity = '');
  });
  // Make rows draggable via the handle
  const observer = new MutationObserver(() => {
    tbody.querySelectorAll('tr').forEach(tr => {
      tr.draggable = true;
    });
  });
  observer.observe(tbody, { childList: true });
  tbody.querySelectorAll('tr').forEach(tr => tr.draggable = true);
}

// === PAC Profile ===
function renderPac(container, profile, markDirty) {
  container.innerHTML = `
    <h2 class="page-title">
      <span class="color-picker-wrap">
        <input type="color" id="profile-color" value="${esc(profile.color || '#00cccc')}">
        ${esc(profile.name)}
      </span>
    </h2>
    <div class="section">
      <div class="section-title">PAC URL</div>
      <div class="form-group">
        <input type="url" id="pac-url" value="${esc(profile.pacUrl || '')}" placeholder="https://example.com/proxy.pac">
        <div class="hint">Leave empty to use the PAC script below instead.</div>
      </div>
    </div>
    <div class="section pac-editor">
      <div class="section-title">PAC Script</div>
      <textarea id="pac-script">${esc(profile.pacScript || '')}</textarea>
    </div>
  `;

  document.getElementById('profile-color').addEventListener('input', (e) => { profile.color = e.target.value; markDirty(); });
  document.getElementById('pac-url').addEventListener('input', (e) => { profile.pacUrl = e.target.value; markDirty(); });
  document.getElementById('pac-script').addEventListener('input', (e) => { profile.pacScript = e.target.value; markDirty(); });
}

// === Rule List Profile ===
function renderRuleList(container, profile, options, markDirty) {
  const allProfiles = [
    { name: 'direct', label: '[Direct]' },
    ...getProfiles().filter(p => p.name !== profile.name).map(p => ({ name: p.name, label: p.name }))
  ];

  container.innerHTML = `
    <h2 class="page-title">
      <span class="color-picker-wrap">
        <input type="color" id="profile-color" value="${esc(profile.color || '#dd6699')}">
        ${esc(profile.name)}
      </span>
    </h2>
    <div class="section">
      <div class="section-title">Rule List URL</div>
      <div class="form-group">
        <input type="url" id="rl-url" value="${esc(profile.sourceUrl || '')}" placeholder="https://example.com/rules.txt">
      </div>
    </div>
    <div class="section">
      <div class="section-title">Match Profile</div>
      <div class="form-group">
        <select id="rl-match">${allProfiles.map(p =>
          `<option value="${esc(p.name)}" ${p.name === profile.matchProfileName ? 'selected' : ''}>${esc(p.label)}</option>`
        ).join('')}</select>
        <div class="hint">Profile to use when a rule matches.</div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Default Profile</div>
      <div class="form-group">
        <select id="rl-default">${allProfiles.map(p =>
          `<option value="${esc(p.name)}" ${p.name === profile.defaultProfileName ? 'selected' : ''}>${esc(p.label)}</option>`
        ).join('')}</select>
        <div class="hint">Profile to use when no rule matches.</div>
      </div>
    </div>
  `;

  document.getElementById('profile-color').addEventListener('input', (e) => { profile.color = e.target.value; markDirty(); });
  document.getElementById('rl-url').addEventListener('input', (e) => { profile.sourceUrl = e.target.value; markDirty(); });
  document.getElementById('rl-match').addEventListener('change', (e) => { profile.matchProfileName = e.target.value; markDirty(); });
  document.getElementById('rl-default').addEventListener('change', (e) => { profile.defaultProfileName = e.target.value; markDirty(); });
}
