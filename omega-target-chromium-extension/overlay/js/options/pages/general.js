import { esc } from '../ui.js';
import { tr } from '../../backend.js';

export function renderGeneral(container, options, markDirty) {
  const o = (key) => options[key];

  container.innerHTML = `
    <h2 class="page-title">General Settings</h2>
    <div class="section">
      <div class="section-title">Startup</div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="opt-refresh" ${o('-refreshOnProfileChange') ? 'checked' : ''}>
          Refresh current tab when profile changes
        </label>
      </div>
      <div class="form-group">
        <label>Startup profile</label>
        <select id="opt-startup">
          <option value="">Last used profile</option>
          ${getProfileOptions(options, o('-startupProfileName'))}
        </select>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Quick Switch</div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="opt-quickswitch" ${o('-enableQuickSwitch') ? 'checked' : ''}>
          Enable quick switch (click icon to cycle profiles)
        </label>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Rule Updates</div>
      <div class="form-group">
        <label>Download interval</label>
        <select id="opt-interval">
          <option value="15" ${o('-downloadInterval') == 15 ? 'selected' : ''}>Every 15 minutes</option>
          <option value="60" ${o('-downloadInterval') == 60 ? 'selected' : ''}>Every hour</option>
          <option value="180" ${o('-downloadInterval') == 180 ? 'selected' : ''}>Every 3 hours</option>
          <option value="720" ${o('-downloadInterval') == 720 ? 'selected' : ''}>Every 12 hours</option>
          <option value="1440" ${o('-downloadInterval') == 1440 ? 'selected' : ''}>Every day</option>
          <option value="-1" ${o('-downloadInterval') == -1 ? 'selected' : ''}>Never</option>
        </select>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Interface</div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="opt-confirm-delete" ${o('-confirmDeletion') ? 'checked' : ''}>
          Confirm before deleting profiles
        </label>
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="opt-add-bottom" ${o('-addConditionsToBottom') ? 'checked' : ''}>
          Add new conditions to bottom of list
        </label>
      </div>
    </div>
  `;

  // Bind events
  const bind = (id, key, transform) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      options[key] = transform ? transform(el) : (el.type === 'checkbox' ? el.checked : el.value);
      markDirty();
    });
  };

  bind('opt-refresh', '-refreshOnProfileChange');
  bind('opt-startup', '-startupProfileName', el => el.value);
  bind('opt-quickswitch', '-enableQuickSwitch');
  bind('opt-interval', '-downloadInterval', el => parseInt(el.value));
  bind('opt-confirm-delete', '-confirmDeletion');
  bind('opt-add-bottom', '-addConditionsToBottom');
}

function getProfileOptions(options, selected) {
  return Object.keys(options)
    .filter(k => k[0] === '+' && options[k]?.name)
    .map(k => {
      const name = options[k].name;
      return `<option value="${esc(name)}" ${name === selected ? 'selected' : ''}>${esc(name)}</option>`;
    })
    .join('');
}
