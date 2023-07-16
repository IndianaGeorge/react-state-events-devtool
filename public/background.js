/*global chrome*/
const stateHistory = {}; // history content: stateHistory[tabId][payload.streamType][payload.streamId].push({ time: Date.now(), payload: payload.value });
const historyIndex = {}; // current history entry if not the last: historyIndex[tabId][payload.streamType][payload.streamId] = payload.index;
const names = {}; // maps stream ids to stream names: names[tabId][message.type][message.id] = message.id;
let currentPort = null; // connected popup for append messages

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

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (sender.tab) { // message came from a tab
    const tabId = String(sender.tab.id);
    if (!stateHistory.hasOwnProperty(tabId)) {
      stateHistory[tabId] = {};
    }
    if (!stateHistory[tabId].hasOwnProperty(message.type)) {
      stateHistory[tabId][message.type] = {};
    }
    switch (message.action) {

      case "update":
        if (!stateHistory[tabId]) {
          stateHistory[tabId] = {};
        }
        if (!stateHistory[tabId][message.type]) {
          stateHistory[tabId][message.type] = {};
        }
        if (!names.hasOwnProperty(tabId)) {
          names[tabId] = {};
        }
        if (!names[tabId].hasOwnProperty(message.type)) {
          names[tabId][message.type] = {};
        }
        if (!names[tabId][message.type].hasOwnProperty(message.id)) {
          names[tabId][message.type][message.id] = message.id;
        }
        if (!stateHistory[tabId][message.type].hasOwnProperty(message.id)) {
          stateHistory[tabId][message.type][message.id] = [];
        }
        const payload = {
          streamType: message.type,
          streamId: message.id,
          value: message.payload
        };
        if (historyIndex?.[tabId]?.[message.type]?.hasOwnProperty(message.id)) {
          // in history mode
          const spliceFrom = historyIndex[tabId][message.type][message.id]+1;
          stateHistory[tabId][message.type][message.id].splice(spliceFrom); // remove history from insertion point forwards
          delete historyIndex[tabId][message.type][message.id]; // stream not in history mode anymore
          payload.at = stateHistory[tabId][message.type][message.id].length;
        }
        stateHistory[tabId][message.type][message.id].push({
          time: Date.now(),
          payload: message.payload,
        });
        // append message
        if (currentPort) { // there is a connected popup
          currentPort.postMessage({
            action: "append",
            payload
          }); // to panel
        }
        break;

      case "new-stream":
        if (!stateHistory.hasOwnProperty(tabId)) {
          stateHistory[tabId] = {};
        }
        if (!stateHistory[tabId].hasOwnProperty(message.type)) {
          stateHistory[tabId][message.type] = {};
        }
        if (!stateHistory[tabId][message.type].hasOwnProperty(message.id)) {
          stateHistory[tabId][message.type][message.id] = [];
        }
        if (!names.hasOwnProperty(tabId)) {
          names[tabId] = {};
        }
        if (!names[tabId].hasOwnProperty(message.type)) {
          names[tabId][message.type] = {};
        }
        names[tabId][message.type][message.id] = message.payload;
        break;

      case "reload":
        stateHistory[tabId] = {};
        historyIndex[tabId] = {};
        names[tabId] = {};
        if (currentPort) { // there is a connected popup
          currentPort.postMessage({
            action: "reload",
          }); // to panel
        }
        break;

      default:
        console.error(`unknown action ${message.action} requested from active content`);
        break;
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
      switch (msg.action) {
        case "list": {
          const tabHistoryExists = stateHistory.hasOwnProperty(tabId);
          const tabHistory = tabHistoryExists ? stateHistory[tabId] : {};
          const streamTypeList = Object.keys(tabHistory);
          const allStreamsList = {};
          for(const streamType of streamTypeList) {
            allStreamsList[streamType] = Object.keys(tabHistory[streamType]);
          }
          port.postMessage({action: "list", payload: { allStreamsList, allStreamsNames: names[tabId] }}); // to panel
          break;
          }
        case "get":{
          if (!validate(msg,['payload'])) {
            return; // message failed validation
          }
          const payload = msg.payload;
          const tabHistoryExists = stateHistory.hasOwnProperty(tabId);
          const tabHistory = tabHistoryExists ? stateHistory[tabId] : {};
          const typedStreamsExist = tabHistoryExists && tabHistory.hasOwnProperty(payload.streamType);
          const typedStreams = typedStreamsExist ? tabHistory[payload.streamType] : {};
          const streamExists = typedStreamsExist && typedStreams.hasOwnProperty(payload.streamId);
          const stream = streamExists ? typedStreams[payload.streamId] : [];
          const tabHistoryIndexExists = historyIndex.hasOwnProperty(tabId);
          const typedHistoryIndexExists = tabHistoryIndexExists ? historyIndex[tabId].hasOwnProperty(payload.streamType) : false;
          const streamHistoryIndexExists = typedHistoryIndexExists ? historyIndex[tabId][payload.streamType].hasOwnProperty(payload.streamId) : false;
          const at = streamHistoryIndexExists ? historyIndex[tabId][payload.streamType][payload.streamId] : stream.length-1;
          port.postMessage({action: "get", payload: stream, at}); // to panel
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
          if (!stateHistory.hasOwnProperty(tabId)) {
            stateHistory[tabId] = {};
          }
          if (!stateHistory[tabId].hasOwnProperty(payload.streamType)) {
            stateHistory[tabId][payload.streamType] = {};
          }
          if (!stateHistory[tabId][payload.streamType].hasOwnProperty(payload.streamId)) {
            stateHistory[tabId][payload.streamType][payload.streamId] = [];
          }
          if (!historyIndex.hasOwnProperty(tabId)) {
            historyIndex[tabId] = {};
          }
          if (!historyIndex[tabId].hasOwnProperty(payload.streamType)) {
            historyIndex[tabId][payload.streamType] = {}
          }
          if (historyIndex[tabId][payload.streamType].hasOwnProperty(payload.streamId)) {
            const spliceFrom = historyIndex[tabId][payload.streamType][payload.streamId]+1;
            stateHistory[tabId][payload.streamType][payload.streamId].splice(spliceFrom); // remove history from insertion point forwards
            delete historyIndex[tabId][payload.streamType][payload.streamId]; // stream not in history mode anymore
          }
          stateHistory[tabId][payload.streamType][payload.streamId].push({ time: Date.now(), payload: payload.value });
          port.postMessage({action: "append", payload: {streamType: payload.streamType, streamId: payload.streamId, value: payload.value, at:stateHistory[tabId][payload.streamType][payload.streamId].length-1}}); // send the update back to panel
          chrome.tabs.sendMessage(tabId, {type: payload.streamType, id: payload.streamId, payload: payload.value}); // send a new state to injected content in current tab
          break;
          }
        case "set": {
          if (!validate(msg,['payload'])) {
            return; // message failed validation
          }
          const payload = msg.payload;
          const tabHistoryExists = stateHistory.hasOwnProperty(tabId);
          const tabHistory = tabHistoryExists ? stateHistory[tabId] : {};
          const typedStreamsExist = tabHistoryExists && tabHistory.hasOwnProperty(payload.streamType);
          const typedStreams = typedStreamsExist ? tabHistory[payload.streamType] : {};
          const streamExists = typedStreamsExist && typedStreams.hasOwnProperty(payload.streamId);
          const stream = streamExists ? typedStreams[payload.streamId] : [];
          if (msg.payload.index < stream.length) { // entry exists?
            if (!historyIndex.hasOwnProperty(tabId)) {
              historyIndex[tabId] = {};
            }
            if (!historyIndex[tabId].hasOwnProperty(payload.streamType)) {
              historyIndex[tabId][payload.streamType] = {}
            }
            historyIndex[tabId][payload.streamType][payload.streamId] = payload.index; // record new position
            port.postMessage({action: "set", payload: {streamType: payload.streamType, streamId: payload.streamId, index: payload.index}}); // send the message back to panel
            chrome.tabs.sendMessage(tabId, {type: payload.streamType, id: payload.streamId, payload: stream[payload.index].payload}); // send a new state to injected content in current tab
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
