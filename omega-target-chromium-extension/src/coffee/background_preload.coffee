window.UglifyJS_NoUnsafeEval = true
localStorage['log'] = ''
localStorage['logLastError'] = ''

window.OmegaContextMenuQuickSwitchHandler = -> null

if chrome.contextMenus?
  if chrome.i18n.getUILanguage?
    # We must create the menu item here before others to make it first.
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
  chrome.contextMenus.onClicked.addListener (info) ->
    switch info.menuItemId
      when 'enableQuickSwitch'
        window.OmegaContextMenuQuickSwitchHandler(info)
      when 'reportIssues'
        OmegaDebug.reportIssue()
      when 'errorLog'
        OmegaDebug.downloadLog()
