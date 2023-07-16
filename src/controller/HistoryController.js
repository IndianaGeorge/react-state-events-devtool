// Hideous hint for linter so chrome is recognized as a global variable
/* global chrome */

import { StateEvents } from 'react-state-events'

export default class HistoryController {
  constructor() {
    this.streamListEvents = new StateEvents({allStreamsList: {}, allStreamsNames: {}},"stream list");
    this.eventListEvents = new StateEvents([], "event list");
    this.selectedStateEvents = new StateEvents({}, "selected state");
    this.selectedStreamEvents = new StateEvents(null, "selected stream");
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

  selectStream(streamType, streamId) {
    if (this.streamListEvents.current.allStreamsList[streamType]?.includes?.(streamId)) {
      this.selectedStreamEvents.publish({type: streamType, index: streamId});
      this.requestStreamHistory(streamType, streamId);
    }
  }

  selectState(streamType, streamId, index) {
    this.selectedStateEvents.publish(index);
    if (this.port) {
      this.port.postMessage({
        action: "set",
        payload: {
          streamType: streamType,
          streamId: streamId,
          index: index,
        },
      });  
    }
  }

  sendEvent(streamType, streamId, newEventPayload) {
    if (this.port) {
      this.port.postMessage({
        action: "update",
        payload: {
          streamType: streamType,
          streamId: streamId,
          value: newEventPayload,
        },
      });  
    }
  }

  onBgMsg (msg) {
    switch (msg.action) {
      case "list":
        if (msg.payload) {
          let payload = msg.payload;
          this.streamListEvents.publish({...payload});
        } else {
          console.error("Got a list of streams but no payload");
        }
        break;
      case "get":
        if (msg.payload) {
          this.eventListEvents.publish([...msg.payload]);
          this.selectedStateEvents.publish(msg.at);
        }
        break;
      case "append":
        if (msg.payload) {
          const payload = msg.payload;
          const cstream = this.selectedStreamEvents.current;
          if (cstream && (cstream.type === payload.streamType) && (cstream.index === payload.streamId)) {
            // appending to currently viewed stream
            const events = [...this.eventListEvents.current];
            if (payload.hasOwnProperty('at')) {
              events.splice(payload.at);
            }
            events.push({time: Date.now(), payload: payload.value});
            this.eventListEvents.publish(events);
            this.selectedStateEvents.publish(events.length-1);
          }
          else {
            // appending to a stream not in view
            const streamlist = this.streamListEvents.current;
            if (!streamlist.allStreamsList[payload.streamType]?.includes?.(payload.streamId)) {
              // we don't have this stream, add it
              // allStreamsList[payload.streamType] = [...streamIds]
              // allStreamsNames[message.type][message.id] = message.id
              const allStreamsList = { ...streamlist.allStreamsList };
              if (!allStreamsList[payload.streamType]) {
                allStreamsList[payload.streamType] = [];
              }
              allStreamsList[payload.streamType] = [...allStreamsList[payload.streamType], payload.streamId];
              const allStreamsNames = { ...streamlist.allStreamsNames };
              if (!allStreamsNames[payload.streamType]) {
                allStreamsNames[payload.streamType] = {};
              }
              if (!allStreamsNames[payload.streamType][payload.streamId]) {
                allStreamsNames[payload.streamType][payload.streamId] = payload.streamId; // unknown name, default to id
              }
              this.streamListEvents.publish({
                allStreamsList,
                allStreamsNames
              });
            }
          }
        }
        break;
      case 'reload':
        this.streamListEvents.publish({allStreamsList: {}, allStreamsNames: {}});
        this.eventListEvents.publish([]);
        this.selectedStateEvents.publish({});
        this.selectedStreamEvents.publish(null);
        const boundInit = this.init.bind(this);
        setTimeout(function () {
          boundInit();
        }, 1000);
        break;
      default:
        break;
    }
  }

  init() {
    const port = chrome.runtime.connect({name: 'react-state-event-devtool_connection'});
    this.setPort(port);
    this.requestStreamList();
  }

  setPort(port) {
    if (this.port) {
      // had a port already! resetting
      this.port.onMessage.removeListener(this.onBgMsg.bind(this));
    }
    this.port = port;
    if (this.port) {
      this.port.onMessage.addListener(this.onBgMsg.bind(this));
    }
  }

  requestStreamHistory(streamType, streamId) {
    if (this.port) {
      this.port.postMessage({
        action: "get",
        payload: {
          streamType: streamType,
          streamId: streamId,
        },
      });
    }
  }

  requestStreamList() {
    if (this.port) {
      this.port.postMessage({action: "list"});
    }
  }

}