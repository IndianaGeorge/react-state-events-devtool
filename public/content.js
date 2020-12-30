window.addEventListener("message", function (event) {
  if (event.source == window && event.data.source == "react-state-event" && event.data.payload && event.data.debugName) {
      console.log(`${event.data.debugName} changed to ${event.data.payload}`)
  }
}, false);

// to publish a value from devtool:
// window.postMessage({ source: "react-state-event-devTool", payload: data, debugName: debugName}, "*");
// when history is clicked: flag debugName
// when message arrives:
// if flagged compare data (sync check) to history entry, set current to history, unflag
// if not flagged: if not on last history entry, wipe future history, add entry. The future is now, old man.

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if( request.message === "clicked_browser_action" ) {
        console.log("hello from content");
      }
    }
);

