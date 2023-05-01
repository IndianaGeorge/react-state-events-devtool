/*global chrome*/
const stateHistory = {}; // history content
const historyIndex = {}; // current history entry if not the last
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
}

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
        if (!stateHistory[tabId][message.type].hasOwnProperty(message.id)) {
          stateHistory[tabId][message.type][message.id] = [];
        }
        stateHistory[tabId][message.type][message.id].push({
          time: Date.now(),
          payload: message.payload,
        });
        console.log(`Updated ${message.type}/${message.id} from ${tabId}`);
        break;
      case "new-stream":
        stateHistory[tabId][message.type][message.id] = [];
        console.log(`Added ${message.type}/${message.id} from ${tabId}`);
        break;
      default:
        break;
    }

    // append message
    if (currentPort) { // there is a connected popup
      currentPort.postMessage({
        action: "append",
        payload: {
          streamType: message.type,
          streamId: message.id,
          value: message.payload
        }
      }); // to panel
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
    console.log('---------Got a message from popup!-----');
    console.log(msg);
    if (!validate(msg,['action'])) {
      alert('Action Validation failed!');
      return; // message failed validation
    }
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabList) {
      if (!tabList || tabList.length < 1) {
        alert('No current window?');
        return; // no current window??
      }
      const tabId = tabList[0].id;
      switch (msg.action) {
        case "list": {
          const tabHistoryExists = stateHistory.hasOwnProperty(tabId);
          const tabHistory = tabHistoryExists ? stateHistory[tabId] : {};
          const streamTypeList = Object.keys(tabHistory);
          const streamTypes = {};
          for(const streamType of streamTypeList) {
            streamTypes[streamType] = Object.keys(tabHistory[streamType]);
          }
          port.postMessage({action: "list", payload: streamTypes}); // to panel
          alert('Send Stream List: '+JSON.stringify(streamTypes));
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
          port.postMessage({action: "get", payload: stream}); // to panel
          break;
          }
        case "update": {
          console.log(msg);
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
          console.log(`Updated ${payload.streamType}/${payload.streamId} at ${tabId} from tools panel`);
          port.postMessage({action: "append", payload: {streamType: payload.streamType, streamId: payload.streamId, value: payload.value}}); // send the update back to panel
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
            console.log(`Set ${payload.streamType}/${payload.streamId} at ${tabId} to history ${payload.index} from tools panel`);
            port.postMessage({action: "set", payload: {streamType: payload.streamType, streamId: payload.streamId, index: payload.index}}); // send the message back to panel
            chrome.tabs.sendMessage(tabId, {type: payload.streamType, id: payload.streamId, payload: stream[payload.index].payload}); // send a new state to injected content in current tab
          }
          break;
        }
        default:
          console.error(`unknown action ${msg.action} requested`);
          break;
      }
    });
  });

  // message came from a tab

});


// chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
// - send me the full history for this stream in the current tab
// - set this stream to this new state in the current tab
// - set this stream to an old state in the current tab
