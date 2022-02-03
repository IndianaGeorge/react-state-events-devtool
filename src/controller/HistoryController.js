// Hideous hint for linter so chrome is recognized as a global variable
/* global chrome */

import { StateEvents } from 'react-state-events'

const sourceName = 'react-state-event-devTool';

export default class HistoryController {
  constructor() {
    this.streamListEvents = new StateEvents([]);
    this.eventListEvents = new StateEvents([]);
    this.selectedStateEvents = new StateEvents({});
    this.selectedStreamEvents = new StateEvents(null);
  }

  getStreamListEvents() {
    return this.streamListEvents;
  }

  getEventListEvents() {
    return this.eventListEvents;
  }

  getSelectedStateEvents() {
    return this.selectedStateEvents;
  }

  getSelectedStreamEvents() {
    return this.selectedStreamEvents;
  }

  selectStream(streamIndex) {
    if (this.streamListEvents.current[streamIndex]) {
      this.selectedStreamEvents.publish(streamIndex);
      this.requestStreamHistory(streamIndex);
    }
  }

  selectState(streamName,index) {
    /*
    console.log(`Tried to select ${streamName}, index ${index}`)
    const selected = { ...this.selectedStateEvents.current, [streamName]:index };
    // tell site about it via message!!
    this.selectedStateEvents.publish(selected);
    */
  }

  sendEvent(newEventPayload) {
    /*
    console.log("sending event...");
    alert("oi!");
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { source: "react-state-event-devTool", payload: newEventPayload, debugName: this.selectedStreamEvents.getCurrent()}
      );
    });
    */
  }

  receiveEvent(eventType, newEventPayload) {
    switch (eventType) {
      case "getStreamNames":
        console.log("Devtool handling getStreamNames response");
        this.streamListEvents.publish(newEventPayload);
        break;

      case "getStateEvents":
        console.log("Devtool handling getStateEvents response");
        this.eventListEvents.publish(newEventPayload);
        break;
    
      default:
        break;
    }
    /*
    const history = { ...this.historyEvents.getCurrent() }; // hey React, this is new!
    const newEvent = {time: new Date(), payload: newEventPayload };
    if (history[streamName]) { // TODO: potential bug, use HasOwn?
      history[streamName].push(newEvent); // add to existing stream
    }
    else {
      history[streamName] = [newEvent]; // create a new stream
    }
    this.historyEvents.publish(history);
    */
  }

  requestStreamHistory(streamId) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {source: "react-state-event-devTool", type: "getStateEvents", spec: streamId}
      );    
    });
  }

  requestStreamList() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {source: "react-state-event-devTool", type: "getStreamNames"}
      );
    });  
  }

}