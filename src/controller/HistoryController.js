// Hideous hint for linter so chrome is recognized as a global variable
/* global chrome */

import { StateEvents } from 'react-state-events'
import { useState } from 'react';

const sourceName = 'react-state-event-devTool';

export default class HistoryController {
  constructor() {
    this.streamListEvents = new StateEvents([]);
    this.eventListEvents = new StateEvents([]);
    this.selectedStateEvents = new StateEvents({});
    this.selectedStreamEvents = new StateEvents(null);
    this.port = null;
  }

  disconnectPort() {
    this.setPort(null);
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

  selectState(streamId,index) {
    if (this.port) {
      this.port.postMessage({
        action: "set",
        payload: {
          streamId: streamId,
          index: index,
        },
      });  
    }
  }

  sendEvent(streamId, newEventPayload) {
    if (this.port) {
      this.port.postMessage({
        action: "update",
        payload: {
          streamId: streamId,
          value: newEventPayload,
        },
      });  
    }
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

  onBgMsg (msg) {
    switch (msg.action) {
      case "list":
        if (msg.payload) {
          this.streamListEvents.publish([...msg.payload]);
          alert(`Got stream list with ${msg.payload.length} streams`)
        }
        break;
      case "get":
        if (msg.payload) {
          this.eventListEvents.publish([...msg.payload]);
          alert(`Got event list with ${msg.payload.length} events`)
        }
        break;
      case "append":
        this.eventListEvents.publish([this.eventListEvents.current, ...msg.payload]);
        break;
      default:
        break;
    }
  }

  setPort(port) {
    if (this.port) {
      this.port.onMessage.removeListener(this.onBgMsg);
    }
    this.port = port;
    if (this.port) {
      this.port.onMessage.addListener(this.onBgMsg);
    }
  }

  requestStreamHistory(streamId) {
    if (this.port) {
      this.port.postMessage({action: "get", streamId: streamId});
    }
  }

  requestStreamList() {
    if (this.port) {
      this.port.postMessage({action: "list"});
    }
  }

}