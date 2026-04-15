export function renderAbout(container) {
  const version = chrome.runtime.getManifest().version;
  container.innerHTML = `
    <h2 class="page-title">About</h2>
    <div class="section">
      <p><strong>AxyProxy Switcher</strong> v${version}</p>
      <p style="margin-top:8px;color:#7f8c8d;">Manage and switch between multiple proxies quickly and easily.</p>
      <p style="margin-top:12px;">
        <a href="https://github.com/vnetmx/SwitchyOmega" target="_blank">GitHub Repository</a>
      </p>
      <p style="margin-top:4px;font-size:12px;color:#95a5a6;">License: GPL-3.0</p>
    </div>
  `;
}
