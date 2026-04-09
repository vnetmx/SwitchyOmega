OmegaTarget = require('switchyomega-target')
OmegaPac = OmegaTarget.OmegaPac
Promise = OmegaTarget.Promise
ChromePort = require('./chrome_port')

# Credential fields that must never be sent to external extensions.
CREDENTIAL_KEYS = ['auth', 'username', 'password']

# Deep-clone an options object with all proxy credential fields redacted.
# This prevents the external API from leaking proxy passwords (SEC-007).
stripCredentials = (options) ->
  return options unless options and typeof options == 'object'
  if Array.isArray(options)
    return (stripCredentials(item) for item in options)
  result = {}
  for own key, value of options
    if CREDENTIAL_KEYS.indexOf(key) >= 0
      # Omit credential fields entirely rather than setting to null,
      # so callers cannot distinguish "no auth" from "auth redacted".
      continue
    result[key] = stripCredentials(value)
  return result

module.exports = class ExternalApi
  constructor: (options) ->
    @options = options
  knownExts:
    'padekgcemlokbadohgkifijomclgjgif': 32
  disabled: false
  listen: ->
    return unless chrome.runtime.onConnectExternal
    chrome.runtime.onConnectExternal.addListener (rawPort) =>
      port = new ChromePort(rawPort)
      port.onMessage.addListener (msg) => @onMessage(msg, port)
      port.onDisconnect.addListener @reenable.bind(this)

  _previousProfileName: null

  reenable: ->
    return unless @disabled

    @options.setProxyNotControllable(null)
    chrome.browserAction.setPopup?({popup: 'popup/index.html'})
    @options.reloadQuickSwitch()
    @disabled = false
    @options.clearBadge()
    @options.applyProfile(@_previousProfileName)

  checkPerm: (port, level) ->
    perm = @knownExts[port.sender.id] || 0
    if perm < level
      port.postMessage({action: 'error', error: 'permission'})
      false
    else
      true

  onMessage: (msg, port) ->
    @options.log.log("#{port.sender.id} -> #{msg.action}", msg)
    switch msg.action
      when 'disable'
        return unless @checkPerm(port, 16)
        return if @disabled
        @disabled = true
        @_previousProfileName = @options.currentProfile()?.name || 'system'
        @options.applyProfile('system').then =>
          reason = 'disabled'
          if @knownExts[port.sender.id] >= 32
            reason = 'upgrade'
          @options.setProxyNotControllable reason, {text: 'X', color: '#5ab432'}
        chrome.browserAction.setPopup?({popup: 'popup/index.html'})
        port.postMessage({action: 'state', state: 'disabled'})
      when 'enable'
        @reenable()
        port.postMessage({action: 'state', state: 'enabled'})
      when 'getOptions'
        return unless @checkPerm(port, 8)
        # Strip all credential fields before sending options to external
        # extensions (SEC-007). Proxy passwords must not leave this extension.
        safeOptions = stripCredentials(@options.getAll())
        port.postMessage({action: 'options', options: safeOptions})
      else
        port.postMessage(
          action: 'error'
          error: 'noSuchAction'
          action_name: msg.action
        )
