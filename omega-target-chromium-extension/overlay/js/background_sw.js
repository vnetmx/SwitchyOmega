// MV3 Service Worker entry point for SwitchyOmega
// Replaces background.html which loaded scripts via <script> tags.
// Service workers cannot use DOM, localStorage, or canvas directly.

// Polyfill localStorage with a synchronous in-memory store.
// The real persistence is handled by chrome.storage.local (async).
// This shim lets existing code that reads/writes localStorage work
// without rewriting every callsite.
var _memStorage = {};
var localStorage = new Proxy(_memStorage, {
  get: function(target, prop) {
    if (prop === 'getItem') return function(k) { return target[k] || null; };
    if (prop === 'setItem') return function(k, v) { target[k] = String(v); };
    if (prop === 'removeItem') return function(k) { delete target[k]; };
    if (prop === 'clear') return function() {
      for (var k in target) delete target[k];
    };
    if (prop === 'length') return Object.keys(target).length;
    return target[prop];
  },
  set: function(target, prop, value) {
    target[prop] = String(value);
    return true;
  },
  deleteProperty: function(target, prop) {
    delete target[prop];
    return true;
  }
});

// Polyfill window for scripts that reference it
var window = self;
window.localStorage = localStorage;

// Polyfill document.getElementById for canvas-icon
// Use OffscreenCanvas instead of DOM canvas in service worker
var _canvasRegistry = {};
var document = {
  getElementById: function(id) {
    if (id === 'canvas-icon') {
      if (!_canvasRegistry[id]) {
        var c = new OffscreenCanvas(128, 128);
        _canvasRegistry[id] = c;
      }
      return _canvasRegistry[id];
    }
    return null;
  },
  createElement: function() { return {}; },
  createEvent: function() {
    return { initEvent: function() {} };
  }
};

// Load all scripts in the same order as background.html
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
