// MV3 Service Worker entry point for SwitchyOmega
// Replaces background.html (MV2) with a service worker.

// === Polyfill: localStorage ===
var _memStore = {};
function StorageShim() {}
StorageShim.prototype.getItem = function(k) { return _memStore.hasOwnProperty(k) ? _memStore[k] : null; };
StorageShim.prototype.setItem = function(k, v) { _memStore[k] = String(v); };
StorageShim.prototype.removeItem = function(k) { delete _memStore[k]; };
StorageShim.prototype.clear = function() { for (var k in _memStore) if (_memStore.hasOwnProperty(k)) delete _memStore[k]; };
StorageShim.prototype.key = function(i) { var keys = Object.keys(_memStore); return i < keys.length ? keys[i] : null; };
Object.defineProperty(StorageShim.prototype, 'length', { get: function() { return Object.keys(_memStore).length; } });

var ls = new StorageShim();
var lsProxy = new Proxy(ls, {
  get: function(t, p) { if (p in t || p in StorageShim.prototype) return t[p]; return _memStore.hasOwnProperty(p) ? _memStore[p] : undefined; },
  set: function(t, p, v) { if (p in StorageShim.prototype) return true; _memStore[p] = String(v); return true; },
  deleteProperty: function(t, p) { delete _memStore[p]; return true; }
});
Object.setPrototypeOf(lsProxy, StorageShim.prototype);
var localStorage = lsProxy;

// === Polyfill: window/document/DOM stubs ===
var window = self;
window.localStorage = localStorage;

var document = {
  getElementById: function(id) { return id === 'canvas-icon' ? new OffscreenCanvas(128, 128) : null; },
  createElement: function() { return { style:{}, href:'', protocol:'', hostname:'', pathname:'', search:'', hash:'', click:function(){}, setAttribute:function(){}, appendChild:function(){}, dispatchEvent:function(){} }; },
  createElementNS: function() { return document.createElement(); },
  createEvent: function() { return { initEvent: function(){} }; },
  body: { appendChild:function(){}, removeChild:function(){}, on:function(){}, off:function(){} }
};
window.document = document;
if (typeof MouseEvent === 'undefined') { function MouseEvent(){} }
if (typeof HTMLElement === 'undefined') { function HTMLElement(){} }
var saveAs = function() {};

// === Polyfill: XMLHttpRequest via fetch() ===
// Service workers don't have XMLHttpRequest. The 'xhr' npm package used by
// fetch_url.coffee needs it. This polyfill wraps fetch() in the XHR interface.
function XMLHttpRequest() {
  this.readyState = 0;
  this.status = 0;
  this.statusText = '';
  this.responseText = '';
  this.responseHeaders = {};
  this._method = 'GET';
  this._url = '';
  this._headers = {};
  this._async = true;
}
XMLHttpRequest.prototype.open = function(method, url, async) {
  this._method = method;
  this._url = url;
  this._async = async !== false;
  this.readyState = 1;
};
XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
  this._headers[name] = value;
};
XMLHttpRequest.prototype.getResponseHeader = function(name) {
  return this.responseHeaders[name.toLowerCase()] || null;
};
XMLHttpRequest.prototype.getAllResponseHeaders = function() {
  var result = '';
  for (var k in this.responseHeaders) {
    result += k + ': ' + this.responseHeaders[k] + '\r\n';
  }
  return result;
};
XMLHttpRequest.prototype.send = function(body) {
  var xhr = this;
  var opts = { method: this._method, headers: this._headers };
  if (body && this._method !== 'GET') opts.body = body;

  fetch(this._url, opts).then(function(response) {
    xhr.status = response.status;
    xhr.statusText = response.statusText;
    xhr.responseHeaders = {};
    response.headers.forEach(function(value, key) {
      xhr.responseHeaders[key.toLowerCase()] = value;
    });
    return response.text();
  }).then(function(text) {
    xhr.responseText = text;
    xhr.readyState = 4;
    if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
    if (xhr.status >= 200 && xhr.status < 300) {
      if (typeof xhr.onload === 'function') xhr.onload();
    } else {
      if (typeof xhr.onerror === 'function') xhr.onerror();
    }
  }).catch(function(err) {
    xhr.readyState = 4;
    xhr.status = 0;
    xhr.statusText = err.message;
    if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
    if (typeof xhr.onerror === 'function') xhr.onerror(err);
  });
};
XMLHttpRequest.prototype.abort = function() {};
window.XMLHttpRequest = XMLHttpRequest;

// === Load scripts ===
try {
  importScripts(
    'js/log_error.js',
    'lib/FileSaver/FileSaver.min.js',
    'js/omega_debug.js',
    'js/background_preload.js',
    'js/omega_pac.min.js',
    'js/omega_target.min.js',
    'js/omega_target_chromium_extension.min.js',
    'img/icons/draw_omega.js',
    'js/background.js'
  );
} catch(e) {
  console.error('SwitchyOmega SW init error:', e);
}
