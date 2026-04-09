// MV3 Service Worker entry point for SwitchyOmega
// Replaces background.html which loaded scripts via <script> tags.

// Polyfill localStorage with a synchronous in-memory store.
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

// Polyfill window/self globals
var window = self;
window.localStorage = localStorage;

// Stub navigator if needed
if (typeof navigator === 'undefined') {
  var navigator = { userAgent: 'ServiceWorker' };
}

// Polyfill document for scripts that need it
var document = {
  getElementById: function(id) {
    if (id === 'canvas-icon') {
      if (!document._canvasCache) {
        document._canvasCache = new OffscreenCanvas(128, 128);
      }
      return document._canvasCache;
    }
    return null;
  },
  createElement: function(tag) {
    // Return a minimal stub — used by FileSaver and url parser
    return {
      style: {},
      href: '',
      protocol: '',
      hostname: '',
      pathname: '',
      search: '',
      hash: '',
      click: function() {},
      setAttribute: function() {},
      appendChild: function() {},
      dispatchEvent: function() {}
    };
  },
  createElementNS: function() {
    return document.createElement();
  },
  createEvent: function() {
    return { initEvent: function() {} };
  },
  body: {
    appendChild: function() {},
    removeChild: function() {},
    on: function() {},
    off: function() {}
  }
};
window.document = document;

// Stub MouseEvent for FileSaver
if (typeof MouseEvent === 'undefined') {
  function MouseEvent() {}
}

// Stub HTMLElement for FileSaver
if (typeof HTMLElement === 'undefined') {
  function HTMLElement() {}
}

// Stub saveAs since FileSaver can't work in service workers
var saveAs = function() {
  console.warn('saveAs not available in service worker');
};

// Load all scripts in the same order as the old background.html
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
  console.error('SwitchyOmega service worker init error:', e);
}
