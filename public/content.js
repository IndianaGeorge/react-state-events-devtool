// get messages from library
window.addEventListener("message", function (event) {
  if (event.source == window && event.data.source === "react-state-event" && event.data.type && event.data.payload) {
    chrome.runtime.sendMessage(event.data);
  }
}, false);

// when history is clicked: flag debugName
// when message arrives:
// if flagged compare data (sync check) to history entry, set current to history, unflag
// if not flagged: if not on last history entry, wipe future history, add entry. The future is now, old man.


// get messages from devtool app, forward to library
function handleAppMessage(msg, sender, respFn) {
  if (msg.source === 'react-state-event-devTool') {
    window.postMessage(msg, "*");
  };
}

chrome.runtime.onMessage.addListener(handleAppMessage);
