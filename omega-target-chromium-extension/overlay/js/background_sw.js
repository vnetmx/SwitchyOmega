// MV3 Service Worker entry point for SwitchyOmega
// Replaces background.html which loaded scripts via <script> tags.

// Polyfill localStorage with an object that mimics the Web Storage API.
// BrowserStorage class calls Object.getPrototypeOf(storage).getItem.call(...)
// so the prototype must have getItem/setItem/removeItem/key/clear methods.
var _memStore = {};

function StorageShim() {}
StorageShim.prototype.getItem = function(k) {
  return _memStore.hasOwnProperty(k) ? _memStore[k] : null;
};
StorageShim.prototype.setItem = function(k, v) {
  _memStore[k] = String(v);
};
StorageShim.prototype.removeItem = function(k) {
  delete _memStore[k];
};
StorageShim.prototype.clear = function() {
  for (var k in _memStore) {
    if (_memStore.hasOwnProperty(k)) delete _memStore[k];
  }
};
StorageShim.prototype.key = function(index) {
  var keys = Object.keys(_memStore);
  return index < keys.length ? keys[index] : null;
};
Object.defineProperty(StorageShim.prototype, 'length', {
  get: function() { return Object.keys(_memStore).length; }
});

var localStorage = new StorageShim();

// Allow bracket notation: localStorage['key'] = 'value'
// by also defining a Proxy wrapper.
var localStorageProxy = new Proxy(localStorage, {
  get: function(target, prop) {
    // Prioritize own methods/properties
    if (prop in target || prop in StorageShim.prototype) {
      return target[prop];
    }
    return _memStore.hasOwnProperty(prop) ? _memStore[prop] : undefined;
  },
  set: function(target, prop, value) {
    if (prop in StorageShim.prototype) return true;
    _memStore[prop] = String(value);
    return true;
  },
  deleteProperty: function(target, prop) {
    delete _memStore[prop];
    return true;
  }
});

// Override the proxy's prototype to return StorageShim.prototype
// so that Object.getPrototypeOf(localStorage) returns correct proto.
Object.setPrototypeOf(localStorageProxy, StorageShim.prototype);

var localStorage = localStorageProxy;

// Polyfill window/self globals
var window = self;
window.localStorage = localStorage;

// Stub navigator if needed
if (typeof navigator === 'undefined') {
  var navigator = { userAgent: 'ServiceWorker' };
}

// Polyfill document for scripts that reference DOM
var document = {
  _canvasCache: null,
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
    return {
      style: {}, href: '', protocol: '', hostname: '',
      pathname: '', search: '', hash: '',
      click: function() {}, setAttribute: function() {},
      appendChild: function() {}, dispatchEvent: function() {}
    };
  },
  createElementNS: function() { return document.createElement(); },
  createEvent: function() { return { initEvent: function() {} }; },
  body: {
    appendChild: function() {}, removeChild: function() {},
    on: function() {}, off: function() {}
  }
};
window.document = document;

// Stub DOM constructors for FileSaver.js
if (typeof MouseEvent === 'undefined') { function MouseEvent() {} }
if (typeof HTMLElement === 'undefined') { function HTMLElement() {} }

// Pre-stub saveAs (FileSaver can't work in service workers)
var saveAs = function() {
  console.warn('saveAs not available in service worker');
};

// Load scripts in the same order as the old background.html
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
