/*global chrome*/

// root.tabId.stateHistory.streamType.streamId
// root.tabId.historyIndices
// root.tabId.names

// history content: stateHistory.push({ time: Date.now(), payload: payload.value });
// current history entry if not the last: historyIndex[payload.streamType][payload.streamId] = payload.index;
// maps stream ids to stream names: names[message.type][message.id] = message.id;
let currentPort = null; // connected popup for append messages, goes away when worker dies

class AsyncMutex {
  constructor() {
    const setResolve = (resolve) => {
      this.resolve = resolve;
    };
    this.setResolve = setResolve.bind(this);
    this.lockPromise = null;
    this.resolve = null;
  }

  async LockAndWaitForUnlock() {
    if (!this.lockPromise) {
      this.lockPromise = new Promise(this.setResolve);
    }
    return this.lockPromise;
  }

  async WaitForUnlock() {
    await this.lockPromise;
  }

  async Release() {
    if (this.resolve) {
      this.resolve();
      this.resolve = null;
    }
  }
}

const root = {};

const initializationMutex = new AsyncMutex();
initializationMutex.LockAndWaitForUnlock();
chrome.storage.session.get('react-state-events-devtool', function (items) {
  Object.assign(root, items);
  initializationMutex.Release();
});


// checks that obj has the listed props
const validate = (obj, props) => {
  if (typeof(props) != 'object') {
    return false;
  }
  for (const prop of props) {
    if (!obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
};

// returns a shallow copy with a deep property modified, creating the path if it's not there
const safeAssign = function (obj, segments, value) {
  try {
    let ref = obj;
    const lastNode = segments.slice(-1);
    const nodes = segments.slice(0,-1);
    nodes.forEach(node => {
      if (!Object.hasOwnProperty.call(ref, node)) {
        ref[node] = {};
      }
      ref = ref[node];
    });
    ref[lastNode] = value;
    return obj;
  }
  catch (e) {
    return safeAssign({}, segments, value);
  }
};

// safe deep compare
const safeCompare = function (obj, segments, value) {
  try {
    let ref = obj;
    let searching = true;
    segments.forEach(node => {
      if (searching) {
        if (!Object.hasOwnProperty.call(ref, node)) {
          searching = false;
        }
        else {
          ref = ref[node];
        }
      }
    });
    if (searching) {
      return ref === value;
    }
    return false;
  }
  catch (e) {
    return false;
  }
};

// safe deep read
const safeRead = function (obj, segments, defaultValue) {
  try {
    let ref = obj;
    let searching = true;
    segments.forEach(node => {
      if (searching) {
        if (!Object.hasOwnProperty.call(ref, node)) {
          searching = false;
        }
        else {
          ref = ref[node];
        }
      }
    });
    if (searching) {
      return ref;
    }
    return defaultValue;
  }
  catch (e) {
    return defaultValue;
  }
};

// safe deep delete
const safeDelete = function (obj, segments) {
  try {
    let ref = obj;
    let searching = true;
    const lastNode = segments.slice(-1);
    const nodes = segments.slice(0,-1);
    nodes.forEach(node => {
      if (searching) {
        if (!Object.hasOwnProperty.call(ref, node)) {
          searching = false;
        }
        else {
          ref = ref[node];
        }
      }
    });
    if (searching) {
      delete ref[lastNode];
    }
  }
  catch (e) {}
};

// safe deep check for property existence
const safeHas = function (obj, segments) {
  try {
    let ref = obj;
    let searching = true;
    segments.forEach(node => {
      if (searching) {
        if (!Object.hasOwnProperty.call(ref, node)) {
          searching = false;
        }
        else {
          ref = ref[node];
        }
      }
    });
    if (searching) {
      return true;
    }
    return false;  
  }
  catch (e) {
    return false;
  }
};

// Array.map but for objects
const map = function (obj, fn) {
  const newObj = {};
  Object.keys(obj).forEach(val => {
    newObj[val] = fn(obj[val], val, obj);
  });
  return newObj;
}

const clearTabStorage = async function (tabId) {
  await initializationMutex.WaitForUnlock();
  if (root[tabId]) {
    delete root[tabId];
    chrome.storage.session.remove([tabId]);  
  }
}

chrome.tabs.onRemoved.addListener(function (tabId) {
  clearTabStorage(tabId);
});

chrome.tabs.onReplaced.addListener(async function (addedTabId, removedTabId) {
  await initializationMutex.WaitForUnlock();
  const data = safeRead(root, [removedTabId], {});
  safeAssign(root, [addedTabId], data);
  chrome.storage.session.set(addedTabId, data);
  chrome.storage.session.remove(removedTabId);
});

chrome.runtime.onMessage.addListener(async function (message, sender) {
  await initializationMutex.WaitForUnlock();
  if (sender.tab) { // message came from a tab
    const tabId = String(sender.tab.id);
    switch (message.action) {
      case "update": {
        const stateHistory = safeRead(root, [tabId,'stateHistory', message.type, message.id], []);
        const names = safeRead(root, [tabId, 'names'], {});
        const historyIndices = safeRead(root, [tabId, 'historyIndices'], {});
        const historyIndex = safeRead(historyIndices, [message.type, message.id], stateHistory.length-1); // zero based array position
        let updatedNames = names;
        if (!safeHas(names, [message.type, message.id])) {
          updatedNames = safeAssign(names, [message.type, message.id], message.id);
        }
        const payload = {
          streamType: message.type,
          streamId: message.id,
          value: message.payload
        };
        const updatedStateHistory = stateHistory.slice(0,historyIndex+1); // remove history from insertion point forwards
        if (stateHistory.length !== updatedStateHistory.length) { 
          safeDelete(historyIndices,  [message.type, message.id]); // stream not in history mode anymore
          payload.at = updatedStateHistory.length; // -1 to point at the last item, +1 for the one we'll push next
        }
        updatedStateHistory.push({
          time: Date.now(),
          payload: message.payload,
        });
        const allStatesHistory = safeRead(root, [tabId,'stateHistory'], []);
        safeAssign(allStatesHistory, [message.type, message.id], updatedStateHistory);
        const newTabData = {
          stateHistory: allStatesHistory,
          names: updatedNames,
          historyIndices: historyIndices,
        };
        root[tabId] = newTabData;
        
        chrome.storage.session.set({
          [tabId]: newTabData,
        });
        // append message
        if (currentPort) { // there is a connected popup
          currentPort.postMessage({
            action: "append",
            payload
          }); // to panel
        }
        break;
      }
      case "new-stream": {
        const names = safeRead(root, [tabId, 'names'], {});
        const newNames = safeAssign(names, [message.type,message.id], message.payload);
        const newTabData = {
          ...root[tabId],
          names: newNames,
        }
        root[tabId] = newTabData;
        chrome.storage.session.set({
          [tabId]: newTabData,
        });
        if (currentPort) {
          const allStreamsList = map(newNames, (val)=>Object.keys(val));
          currentPort.postMessage({action: "list", payload: { allStreamsList, allStreamsNames: newNames }}); // to panel
        }
        break;
      }
      case "reload": {
        if (currentPort) { // there is a connected popup
          currentPort.postMessage({
            action: "reload",
          }); // to panel
        }
        clearTabStorage(tabId);
        break;
      }
      default: {
        console.error(`unknown action ${message.action} requested from active content`);
        break;
      }
    }
  }
  else {
    // message came from ???
  }
});

chrome.runtime.onConnect.addListener(function (port) {
  currentPort = port; // keep most recent popup port connection for append messages
  port.onDisconnect.addListener(function() {
    currentPort = null;
  });
  // message came from panel
  port.onMessage.addListener(function (msg) {
    if (!validate(msg,['action'])) {
      console.error('Got a request from panel with no action');
      return; // message failed validation
    }
    chrome.tabs.query({'active': true, 'currentWindow': true}, async function (tabList) {
      if (!tabList || tabList.length < 1) {
        console.error('Query for current tab yielded no results');
        return; // no current window??
      }
      await initializationMutex.WaitForUnlock();
      const tabId = tabList[0].id;
      switch (msg.action) {
        case "list": {
          const names = safeRead(root, [tabId, 'names'], {});
          const allStreamsList = map(names, (val)=>Object.keys(val));
          port.postMessage({action: "list", payload: { allStreamsList, allStreamsNames: names }}); // to panel
          break;
        }

        case "get": {
          if (!validate(msg,['payload'])) {
            return; // message failed validation
          }
          if (!validate(msg.payload,['streamType','streamId'])) {
            return; // payload failed validation
          }
          const payload = msg.payload;
          const stateHistory = safeRead(root, [tabId,'stateHistory', payload.streamType, payload.streamId], []);
          const at = safeRead(root, [tabId, 'historyIndices', payload.streamType, payload.streamId], Math.max(stateHistory.length-1, 0));
          port.postMessage({action: "get", payload: stateHistory, at}); // to panel
          break;
        }

        case "update": {
          if (!validate(msg,['payload'])) {
            return; // message failed validation
          }
          if (!validate(msg.payload,['streamType','streamId','value'])) {
            return; // payload failed validation
          }
          const payload = msg.payload;

          const stateHistory = safeRead(root, [tabId,'stateHistory', payload.streamType, payload.streamId], []);
          const historyIndices = safeRead(root, [tabId, 'historyIndices'], {});
          const historyIndex = safeRead(historyIndices, [payload.streamType, payload.streamId], stateHistory.length-1); // zero based array position      
          const updatedStream = stateHistory.slice(0,historyIndex+1); // remove history from insertion point forwards
          if (stateHistory.length !== updatedStream.length) { 
            safeDelete(historyIndices,  [payload.streamType, payload.streamId]); // stream not in history mode anymore
            payload.at = updatedStream.length; // -1 to point at the last item, +1 for the one we'll push next
          }
          updatedStream.push({
            time: Date.now(),
            payload: payload.value,
          });
          port.postMessage({action: "append", payload: {streamType: payload.streamType, streamId: payload.streamId, value: payload.value, ...(payload.at && {at: payload.at}) }}); // send the update back to panel
          chrome.tabs.sendMessage(tabId, {type: payload.streamType, id: payload.streamId, payload: payload.value}); // send a new state to injected content in current tab
          const allStatesHistory = safeRead(root, [tabId,'stateHistory'], []);
          safeAssign(allStatesHistory, [payload.streamType, payload.streamId], updatedStream);
          const newTabData = {
            ...root[tabId],
            stateHistory: allStatesHistory,
            historyIndices: historyIndices,
          };
          root[tabId] = newTabData;
          chrome.storage.session.set({
            [tabId]: newTabData,
          });
          break;
        }

        case "set": {
          if (!validate(msg,['payload'])) {
            return; // message failed validation
          }
          if (!validate(msg.payload,['streamType','streamId','index'])) {
            return; // payload failed validation
          }
          const payload = msg.payload;
          const stateHistory = safeRead(root, [tabId,'stateHistory', payload.streamType, payload.streamId], []);
          if (msg.payload.index < stateHistory.length) { // entry exists?
            const historyIndices = safeRead(root, [tabId, 'historyIndices'], {});
            const newHistoryIndices = safeAssign(historyIndices, [payload.streamType, payload.streamId], payload.index); // record new position
            port.postMessage({action: "set", payload: {streamType: payload.streamType, streamId: payload.streamId, index: payload.index}}); // send the message back to panel
            chrome.tabs.sendMessage(tabId, {type: payload.streamType, id: payload.streamId, payload: stateHistory[payload.index].payload}); // send a new state to injected content in current tab  
            const newTabData = {
              ...root[tabId],
              historyIndices: newHistoryIndices,
            };
            root[tabId] = newTabData;
            chrome.storage.session.set({
              [tabId]: newTabData,
            });
          }
          break;
        }
        default:
          console.error(`unknown action ${msg.action} requested from panel`);
          break;
      }
    });
  });
});
