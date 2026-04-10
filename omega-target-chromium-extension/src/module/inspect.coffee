OmegaTarget = require('switchyomega-target')
OmegaPac = OmegaTarget.OmegaPac
Promise = OmegaTarget.Promise

module.exports = class Inspect
  _enabled: false
  constructor: (onInspect) ->
    @onInspect = onInspect
    # MV3: use onClicked listener instead of onclick property
    chrome.contextMenus?.onClicked?.addListener (info, tab) =>
      if @_enabled and @propForMenuItem[info.menuItemId]?
        @inspect(info, tab)

  enable: ->
    return unless chrome.contextMenus?
    return unless chrome.i18n.getUILanguage?
    return if @_enabled

    webResource = [
      "http://*/*"
      "https://*/*"
      "ftp://*/*"
    ]

    # MV3: wrap in try/catch — items may already exist from a previous SW run
    try chrome.contextMenus.create({
      id: 'inspectFrame'
      title: chrome.i18n.getMessage('contextMenu_inspectFrame')
      contexts: ['frame']
      documentUrlPatterns: webResource
    })

    try chrome.contextMenus.create({
      id: 'inspectLink'
      title: chrome.i18n.getMessage('contextMenu_inspectLink')
      contexts: ['link']
      targetUrlPatterns: webResource
    })

    try chrome.contextMenus.create({
      id: 'inspectElement'
      title: chrome.i18n.getMessage('contextMenu_inspectElement')
      contexts: [
        'image'
        'video'
        'audio'
      ]
      targetUrlPatterns: webResource
    })

    @_enabled = true

  disable: ->
    return unless @_enabled
    for own menuId of @propForMenuItem
      try chrome.contextMenus.remove(menuId)
    @_enabled = false

  propForMenuItem:
    'inspectPage': 'pageUrl'
    'inspectFrame': 'frameUrl'
    'inspectLink': 'linkUrl'
    'inspectElement': 'srcUrl'

  inspect: (info, tab) ->
    return unless info.menuItemId
    url = info[@propForMenuItem[info.menuItemId]]
    if not url and info.menuItemId == 'inspectPage'
      url = tab.url
    return unless url

    @onInspect(url, tab)
