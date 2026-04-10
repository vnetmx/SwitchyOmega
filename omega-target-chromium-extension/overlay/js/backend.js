// Backend communication — all state flows through chrome.runtime.sendMessage
export function callBackground(method, ...args) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ method, args }, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!response) return reject(new Error('No response from background'));
      if (response.error) return reject(response.error);
      resolve(response.result);
    });
  });
}

export function callBackgroundNoReply(method, ...args) {
  chrome.runtime.sendMessage({ method, args, noReply: true, refreshActivePage: true });
}

export function getState(keys) {
  return callBackground('getState', keys);
}

export function setState(items) {
  return callBackground('setState', items);
}

export function getAll() {
  return callBackground('getAll');
}

export function applyProfile(name) {
  callBackgroundNoReply('applyProfile', name);
}

export function renameProfile(from, to) {
  return callBackground('renameProfile', from, to).then(() => getAll());
}

export function patchOptions(patch) {
  return callBackground('patch', patch).then(() => getAll());
}

export function resetOptions(options) {
  return callBackground('reset', options).then(() => getAll());
}

export function updateProfile(name, bypassCache) {
  return callBackground('updateProfile', name, bypassCache);
}

export function getPageInfo(tabId, url) {
  return callBackground('getPageInfo', { tabId, url });
}

// i18n
export function tr(key, ...args) {
  return chrome.i18n.getMessage(key, args) || key;
}
