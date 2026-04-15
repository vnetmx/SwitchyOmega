import { esc } from '../ui.js';
import { getAll, resetOptions } from '../../backend.js';

export function renderIO(container, options, reloadOptions) {
  container.innerHTML = `
    <h2 class="page-title">Import / Export</h2>
    <div class="section">
      <div class="section-title">Export</div>
      <p style="margin-bottom:8px;">Download a backup of all profiles and settings.</p>
      <button class="btn btn-primary" id="btn-export">Export settings</button>
    </div>
    <div class="section">
      <div class="section-title">Import</div>
      <p style="margin-bottom:8px;">Restore from an AxyProxy Switcher backup file (JSON).</p>
      <input type="file" id="file-import" accept=".json,.bak" style="margin-bottom:8px;">
      <div id="import-status"></div>
    </div>
    <div class="section">
      <div class="section-title">Reset</div>
      <p style="margin-bottom:8px;">Reset all settings to default. This cannot be undone.</p>
      <button class="btn btn-danger" id="btn-reset">Reset all settings</button>
    </div>
  `;

  document.getElementById('btn-export').addEventListener('click', () => {
    const data = JSON.stringify(options, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OmegaOptions_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('file-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById('import-status');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Invalid format');
      await resetOptions(data);
      status.innerHTML = '<div class="alert alert-success">Import successful! Reloading…</div>';
      await reloadOptions();
    } catch (err) {
      status.innerHTML = `<div class="alert alert-danger">Import failed: ${esc(err.message)}</div>`;
    }
  });

  document.getElementById('btn-reset').addEventListener('click', async () => {
    if (!confirm('Reset ALL settings? This will delete all profiles and restore defaults.')) return;
    try {
      await resetOptions(null);
      await reloadOptions();
    } catch (err) {
      alert('Reset failed: ' + err.message);
    }
  });
}
