var log = document.getElementById('log');
function L(msg) { log.textContent += msg + '\n'; }

L('Extension ID: ' + chrome.runtime.id);
L('Manifest version: ' + chrome.runtime.getManifest().manifest_version);
L('');

L('Querying service worker log...');
L('');

chrome.runtime.sendMessage({method: 'getSWLog'}, function(response) {
  if (chrome.runtime.lastError) {
    L('SW not reachable: ' + chrome.runtime.lastError.message);
    L('');
    L('The service worker crashed before registering its message listener.');
    L('Check chrome://extensions -> Details -> Service Worker for errors.');
    return;
  }
  if (response && response.log) {
    L('=== Service Worker Log ===');
    response.log.forEach(function(line) { L(line); });
    L('=== End SW Log ===');
  } else {
    L('Unexpected response: ' + JSON.stringify(response));
  }
});

setTimeout(function() {
  L('');
  L('(5s timeout reached)');
}, 5000);
