window.OmegaDebug =
  getProjectVersion: ->
    chrome.runtime.getManifest().version
  getExtensionVersion: ->
    chrome.runtime.getManifest().version
  downloadLog: ->
    # MV3: service workers have no DOM. Open options page to trigger
    # the download from there, or create a blob URL via offscreen doc.
    # For now, just log to console — the options page has its own
    # downloadLog that works with DOM.
    logContent = localStorage['log'] || '(empty log)'
    console.log('OmegaDebug log:\n', logContent)
  resetOptions: ->
    localStorage.clear()
    localStorage['omega.local.syncOptions'] = '"conflict"'
    chrome.storage.local.clear()
    chrome.runtime.reload()
  reportIssue: ->
    url = 'https://github.com/FelisCatus/SwitchyOmega/issues/new'
    try
      version = OmegaDebug.getProjectVersion()
      body = "SwitchyOmega #{version}\n#{navigator.userAgent}"
      url += '?title=&body=' + encodeURIComponent(body)
    chrome.tabs.create(url: url)
