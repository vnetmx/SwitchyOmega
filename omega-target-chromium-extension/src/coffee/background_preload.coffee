window.UglifyJS_NoUnsafeEval = true
localStorage['log'] = ''
localStorage['logLastError'] = ''

window.OmegaContextMenuQuickSwitchHandler = -> null

# MV3: context menus persist across SW restarts. Only create them once
# (on install/update), not on every SW wake-up.
chrome.runtime.onInstalled?.addListener ->
  return unless chrome.contextMenus?
  chrome.contextMenus.removeAll ->
    if chrome.i18n.getUILanguage?
      chrome.contextMenus.create({
        id: 'enableQuickSwitch'
        title: chrome.i18n.getMessage('contextMenu_enableQuickSwitch')
        type: 'checkbox'
        checked: false
        contexts: ["action"]
      })

    chrome.contextMenus.create({
      id: 'reportIssues'
      title: chrome.i18n.getMessage('popup_reportIssues')
      contexts: ["action"]
    })

    chrome.contextMenus.create({
      id: 'errorLog'
      title: chrome.i18n.getMessage('popup_errorLog')
      contexts: ["action"]
    })

# MV3: onclick property removed; use onClicked listener instead.
if chrome.contextMenus?.onClicked?
  chrome.contextMenus.onClicked.addListener (info) ->
    switch info.menuItemId
      when 'enableQuickSwitch'
        window.OmegaContextMenuQuickSwitchHandler(info)
      when 'reportIssues'
        OmegaDebug.reportIssue()
      when 'errorLog'
        OmegaDebug.downloadLog()
