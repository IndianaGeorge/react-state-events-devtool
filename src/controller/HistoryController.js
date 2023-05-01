import { StateEvents } from 'react-state-events'

export default class HistoryController {
  constructor() {
    this.streamListEvents = new StateEvents({});
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

  selectStream(streamType, streamId) {
    if (this.streamListEvents.current?.[streamType]?.includes?.(streamId)) {
      this.selectedStreamEvents.publish({type: streamType, index: streamId});
      this.requestStreamHistory(streamType, streamId);
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
          alert(`Publishing new payload: ${JSON.stringify({...payload})}`);
          this.streamListEvents.publish({...payload});
        } else {
          console.error("Got a list of streams but no payload");
        }
        break;
      case "get":
        if (msg.payload) {
          this.eventListEvents.publish([...msg.payload]);
        }
        break;
      case "append":
        if (msg.payload && this.selectedStreamEvents.current) {
          const cstream = this.selectedStreamEvents.current;
          const payload = msg.payload;
          if ((cstream.type === payload.streamType) && (cstream.index === payload.streamId)) {
            this.eventListEvents.publish([...this.eventListEvents.current, {time: Date.now(), payload: payload.value}]);
          }
        }
        break;
      default:
        break;
    }
  }

  setPort(port) {
    if (this.port) {
      alert("had a port already! resetting");
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