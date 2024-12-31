/*global chrome*/

chrome.runtime.sendMessage({
  action: 'reload',
});

// get messages from library in same tab, send to background
window.addEventListener("message", function (event) {
  if (event.source === window
    && event.origin === window.origin
    ) {
      let data = null;
      switch (event.data.type) {
        case "react-state-event-devTool-streamId":
          if (!event.data.id || !event.data.payload) {
            return;
          }
          if (typeof event.data.payload === 'string') {
            data = {action:"new-stream", type:"StateEvents", id:event.data.id, payload:event.data.payload, init: event.data.init};
          } else {
            data = {action:"new-stream", type:event.data.payload.streamType, id:event.data.id, payload:event.data.payload.debugName, init: event.data.init};
          }
          break;
        case "react-state-event-devTool-notify":
          if (!event.data.payload) {
            return;
          }
          const p = event.data.payload;
          if (p.success) {
            data = {action:"update", type:p.streamType, id:p.streamId, payload:p.value};
          }
          break;
        case "react-state-event-initrequest":
          if (!event.data.name) {
            return;
          }
          data = {action:"new-stream", type:"ExternalStateEvents", id:event.data.name, payload:event.data.name, init: event.data.init};
          break;
        default:
          return;
      }
      chrome.runtime.sendMessage(data);
  }
}, false);

// get messages from background, forward to library in same tab
function handleAppMessage(msg, sender, respFn) {
  if (msg.origin !== 'react-state-event-devTool') {
    switch (msg.type) {
      case "StateEvents":
        window.postMessage({type: "react-state-event-devTool-set", id: msg.id, payload: msg.payload}, window.origin);
        break;
      case "ExternalStateEvents":
        window.postMessage({type: "react-state-event", name: msg.id, success: true, payload: msg.payload}, window.origin);
        break;
      default:
        return;
    }
    window.postMessage(msg, "*");
  };
}

chrome.runtime.onMessage.addListener(handleAppMessage);
