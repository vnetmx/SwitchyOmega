// MV3 Service Worker — AxyProxy Switcher
// Polyfills required because the background code was written for MV2 (DOM context).

// === 1. localStorage polyfill ===
var _ms = {};
function StorageShim() {}
StorageShim.prototype.getItem = function(k) { return _ms.hasOwnProperty(k) ? _ms[k] : null; };
StorageShim.prototype.setItem = function(k, v) { _ms[k] = String(v); };
StorageShim.prototype.removeItem = function(k) { delete _ms[k]; };
StorageShim.prototype.clear = function() { for (var k in _ms) if (_ms.hasOwnProperty(k)) delete _ms[k]; };
StorageShim.prototype.key = function(i) { var keys = Object.keys(_ms); return i < keys.length ? keys[i] : null; };
Object.defineProperty(StorageShim.prototype, 'length', { get: function() { return Object.keys(_ms).length; } });
var _lsReal = new StorageShim();
var localStorage = new Proxy(_lsReal, {
  get: function(t, p) { if (p in t || p in StorageShim.prototype) return t[p]; return _ms.hasOwnProperty(p) ? _ms[p] : undefined; },
  set: function(t, p, v) { _ms[p] = String(v); return true; },
  deleteProperty: function(t, p) { delete _ms[p]; return true; }
});
Object.setPrototypeOf(localStorage, StorageShim.prototype);

// === 2. window / document / DOM polyfills ===
var window = self;
window.localStorage = localStorage;
var document = {
  getElementById: function(id) {
    if (id === 'canvas-icon') {
      if (!this._c) this._c = new OffscreenCanvas(128, 128);
      return this._c;
    }
    return null;
  },
  createElement: function() {
    return { style:{}, href:'', protocol:'', hostname:'', pathname:'',
             search:'', hash:'', click:function(){}, setAttribute:function(){},
             appendChild:function(){}, removeChild:function(){},
             dispatchEvent:function(){}, setAttribute:function(){},
             nodeName:'', nodeType:1 };
  },
  createElementNS: function() { return document.createElement(); },
  createEvent: function() { return { initEvent:function(){} }; },
  body: { appendChild:function(){}, removeChild:function(){} }
};
window.document = document;

// === 3. Constructor stubs ===
if (typeof MouseEvent === 'undefined') self.MouseEvent = function(){};
if (typeof HTMLElement === 'undefined') self.HTMLElement = function(){};
self.saveAs = function() {};

// === 4. XMLHttpRequest polyfill (fetch-based) ===
self.XMLHttpRequest = function() {
  this.readyState = 0; this.status = 0; this.statusText = '';
  this.responseText = ''; this._rh = {};
  this._method = 'GET'; this._url = ''; this._headers = {};
};
self.XMLHttpRequest.prototype.open = function(m, u) { this._method = m; this._url = u; this.readyState = 1; };
self.XMLHttpRequest.prototype.setRequestHeader = function(n, v) { this._headers[n] = v; };
self.XMLHttpRequest.prototype.getResponseHeader = function(n) { return this._rh[n.toLowerCase()] || null; };
self.XMLHttpRequest.prototype.getAllResponseHeaders = function() {
  var r = ''; for (var k in this._rh) r += k + ': ' + this._rh[k] + '\r\n'; return r;
};
self.XMLHttpRequest.prototype.send = function(body) {
  var xhr = this;
  var opts = { method: this._method, headers: this._headers };
  if (body && this._method !== 'GET' && this._method !== 'HEAD') opts.body = body;
  fetch(this._url, opts).then(function(resp) {
    xhr.status = resp.status; xhr.statusText = resp.statusText; xhr._rh = {};
    resp.headers.forEach(function(v, k) { xhr._rh[k.toLowerCase()] = v; });
    return resp.text();
  }).then(function(text) {
    xhr.responseText = text; xhr.readyState = 4;
    if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
    if (xhr.status >= 200 && xhr.status < 400) { if (typeof xhr.onload === 'function') xhr.onload(); }
    else { if (typeof xhr.onerror === 'function') xhr.onerror(); }
  }).catch(function(err) {
    xhr.readyState = 4; xhr.status = 0; xhr.statusText = err.message;
    if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
    if (typeof xhr.onerror === 'function') xhr.onerror(err);
  });
};
self.XMLHttpRequest.prototype.abort = function() {};
self.XMLHttpRequest.DONE = 4;

// === 5. Load scripts one by one so we can identify crashes ===
var _scripts = [
  '../js/log_error.js',
  '../lib/FileSaver/FileSaver.min.js',
  '../js/omega_debug.js',
  '../js/background_preload.js',
  '../js/omega_pac.min.js',
  '../js/omega_target.min.js',
  '../js/omega_target_chromium_extension.min.js',
  '../img/icons/draw_omega.js',
  '../js/background.js'
];

var _swErrors = [];
for (var _i = 0; _i < _scripts.length; _i++) {
  try {
    importScripts(_scripts[_i]);
  } catch(e) {
    _swErrors.push(_scripts[_i] + ': ' + e.message);
    console.error('[SW CRASH] ' + _scripts[_i], e);
  }
}

// === 6. Fallback message handler if background.js failed to load ===
// This ensures the popup/options can at least show an error instead of hanging.
if (_swErrors.length > 0) {
  chrome.runtime.onMessage.addListener(function(request, sender, respond) {
    respond({ error: { message: 'Service worker errors: ' + _swErrors.join('; ') } });
    return false;
  });
}
