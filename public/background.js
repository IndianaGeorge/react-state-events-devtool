/*global chrome*/

// storage stateHistory key: `states.${tabId}.${streamType}.${streamId}`
// storage historyIndex key: `historyIndices.${tabId}`
// storage names key: `names.${tabId}`
// history content: stateHistory.push({ time: Date.now(), payload: payload.value });
// current history entry if not the last: historyIndex[payload.streamType][payload.streamId] = payload.index;
// maps stream ids to stream names: names[message.type][message.id] = message.id;
let currentPort = null; // connected popup for append messages, goes away when worker dies

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
    lastNode = segments.slice(-1);
    nodes = segments.slice(0,-1);
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
      return ref == value;
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
    lastNode = segments.slice(-1);
    nodes = segments.slice(0,-1);
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
  newObj = {};
  Object.keys(obj).map((val) => {
    newObj[val] = fn(obj[val], val, obj);
  });
  return newObj;
}

const clearTabStorage = function (tabId) {
  const historyIndicesKey = `historyIndices.${tabId}`;
  const namesKey = `names.${tabId}`;
  chrome.storage.session.get([namesKey, historyIndicesKey], function (items) {
    const names = safeRead(items, [namesKey], {});
    const toRemove = [];
    map(names, function (streamTypeNames, typeName) {
      map(streamTypeNames, function (streamIdNames, idName) {
        const stateHistoryKey = `states.${tabId}.${typeName}.${idName}`;
        toRemove.push(stateHistoryKey);
      });
    });
    toRemove.push(historyIndicesKey);
    toRemove.push(namesKey)
    chrome.storage.session.remove(toRemove);
  });
}

chrome.tabs.onRemoved.addListener(function (tabId) {
  clearTabStorage(tabId);
});

chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
  console.log("Replacing tab",removedTabId);
  const oldHistoryIndicesKey = `historyIndices.${removedTabId}`;
  const oldNamesKey = `names.${removedTabId}`;
  const newHistoryIndicesKey = `historyIndices.${addedTabId}`;
  const newNamesKey = `names.${addedTabId}`;
  chrome.storage.session.get([oldNamesKey, oldHistoryIndicesKey], function (items) {
    const names = safeRead(items, [oldNamesKey], {});
    const historyIndices = safeRead(items, [oldHistoryIndicesKey], {});
    const stateHistoryKeysMap = {};
    const oldStateHistoryKeys = [];
    map(names, function (streamTypeNames, typeName) {
      map(streamTypeNames, function (streamIdNames, idName) {
        const oldStateHistoryKey = `states.${removedTabId}.${typeName}.${idName}`;
        const newStateHistoryKey = `states.${addedTabId}.${typeName}.${idName}`;
        stateHistoryKeysMap[oldStateHistoryKey] = newStateHistoryKey;
        oldStateHistoryKeys.push(oldStateHistoryKey);
      });
    });
    chrome.storage.session.get(oldStateHistoryKeys, function (streamItems) {
      const newItems = {
        [newNamesKey]: names,
        [newHistoryIndicesKey]: historyIndices,
      };
      oldStateHistoryKeys.forEach(function (oldKey) {
        const newKey = stateHistoryKeysMap[oldKey];
        if (streamItems.hasOwnProperty(oldKey)) {
          newItems[newKey] = streamItems[oldKey];
        }
      });
      chrome.storage.session.remove(oldStateHistoryKeys);
      chrome.storage.session.remove([oldHistoryIndicesKey, oldNamesKey]);
      chrome.storage.session.set(newItems);
    });
  });  
});

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (sender.tab) { // message came from a tab
    const tabId = String(sender.tab.id);
    const historyIndicesKey = `historyIndices.${tabId}`;
    const namesKey = `names.${tabId}`;

    switch (message.action) {
      case "update": {
        const stateHistoryKey = `states.${tabId}.${message.type}.${message.id}`;
        chrome.storage.session.get([stateHistoryKey, namesKey, historyIndicesKey], function (items) {
          const stateHistory = safeRead(items, [stateHistoryKey], []);
          const names = safeRead(items, [namesKey], {});
          const historyIndices = safeRead(items, [historyIndicesKey], {});
          const historyIndex = safeRead(historyIndices, [message.type, message.id], stateHistory.length-1); // zero based array position
          const updatedNames = safeAssign(names, [message.type, message.id], message.id);
          const payload = {
            streamType: message.type,
            streamId: message.id,
            value: message.payload
          };
          const updatedStateHistory = stateHistory.slice(0,historyIndex+1); // remove history from insertion point forwards
          if (stateHistory.length != updatedStateHistory.length) { 
            safeDelete(historyIndices,  [message.type, message.id]); // stream not in history mode anymore
            payload.at = updatedStateHistory.length; // -1 to point at the last item, +1 for the one we'll push next
          }
          updatedStateHistory.push({
            time: Date.now(),
            payload: message.payload,
          });
          
          chrome.storage.session.set({
            [stateHistoryKey]: updatedStateHistory,
            [namesKey]: updatedNames,
            [historyIndicesKey]: historyIndices,
          });

          // append message
          if (currentPort) { // there is a connected popup
            currentPort.postMessage({
              action: "append",
              payload
            }); // to panel
          }  
        });      
        break;
      }
      case "new-stream": {
        chrome.storage.session.get(namesKey, function (items) {
          const names = safeRead(items, [namesKey], {});
          const newNames = safeAssign(names, [message.type,message.id], message.payload);
          chrome.storage.session.set({
            [namesKey]: newNames,
          });
        });
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
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabList) {
      if (!tabList || tabList.length < 1) {
        console.error('Query for current tab yielded no results');
        return; // no current window??
      }
      const tabId = tabList[0].id;
      const namesKey = `names.${tabId}`;
      switch (msg.action) {
        case "list": {
          chrome.storage.session.get(namesKey, function (items) {
            const allStreamsList = map(safeRead(items, [namesKey], {}),(val)=>Object.keys(val));
            port.postMessage({action: "list", payload: { allStreamsList, allStreamsNames: items[namesKey] }}); // to panel
          });
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
          const stateHistoryKey = `states.${tabId}.${payload.streamType}.${payload.streamId}`;
          const historyIndicesKey = `historyIndices.${tabId}`;
          chrome.storage.session.get([stateHistoryKey, historyIndicesKey], function (items) {
            const stream = safeRead(items, [stateHistoryKey], []);
            const at = safeRead(items, [historyIndicesKey, payload.streamType, payload.streamId], Math.max(stream.length-1, 0));
            port.postMessage({action: "get", payload: stream, at}); // to panel
          });
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
          const stateHistoryKey = `states.${tabId}.${payload.streamType}.${payload.streamId}`;
          const historyIndicesKey = `historyIndices.${tabId}`;
          chrome.storage.session.get([stateHistoryKey, historyIndicesKey], function (items) {
            const stream = safeRead(items, [stateHistoryKey], []);
            const historyIndices = safeRead(items, [historyIndicesKey], {});
            const historyIndex = safeRead(historyIndices, [payload.streamType, payload.streamId], stream.length-1); // zero based array position      
            const updatedStream = stream.slice(0,historyIndex+1); // remove history from insertion point forwards
            if (stream.length != updatedStream.length) { 
              safeDelete(historyIndices,  [payload.streamType, payload.streamId]); // stream not in history mode anymore
              payload.at = updatedStream.length; // -1 to point at the last item, +1 for the one we'll push next
            }
            updatedStream.push({
              time: Date.now(),
              payload: payload.value,
            });
            port.postMessage({action: "append", payload: {streamType: payload.streamType, streamId: payload.streamId, value: payload.value, at: payload.at}}); // send the update back to panel
            chrome.tabs.sendMessage(tabId, {type: payload.streamType, id: payload.streamId, payload: payload.value}); // send a new state to injected content in current tab
            chrome.storage.session.set({
              [stateHistoryKey]: updatedStream,
              [historyIndicesKey]: historyIndices,
            });
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
          const stateHistoryKey = `states.${tabId}.${payload.streamType}.${payload.streamId}`;
          const historyIndicesKey = `historyIndices.${tabId}`;
          chrome.storage.session.get([stateHistoryKey, historyIndicesKey], function (items) {
            const stream = safeRead(items, [stateHistoryKey], []);
            if (msg.payload.index < stream.length) { // entry exists?
              const historyIndices = safeRead(items, [historyIndicesKey], {});
              const newHistoryIndices = safeAssign(historyIndices, [payload.streamType, payload.streamId], payload.index); // record new position
              port.postMessage({action: "set", payload: {streamType: payload.streamType, streamId: payload.streamId, index: payload.index}}); // send the message back to panel
              chrome.tabs.sendMessage(tabId, {type: payload.streamType, id: payload.streamId, payload: stream[payload.index].payload}); // send a new state to injected content in current tab  
              chrome.storage.session.set({
                [historyIndicesKey]: newHistoryIndices,
              });
            }
          });
          break;
        }
        default:
          console.error(`unknown action ${msg.action} requested from panel`);
          break;
      }
    });
  });
});
