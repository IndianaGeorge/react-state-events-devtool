// Hideous hint for linter so chrome is recognized as a global variable
/* global chrome */

import { StateEvents } from 'react-state-events'

const sourceName = 'react-state-event-devTool';

export default class HistoryController {
    constructor() {
        this.historyEvents = new StateEvents({});
        this.selectedStateEvents = new StateEvents({});
        this.selectedStreamEvents = new StateEvents(null);
    }

    getHistoryEvents() {
        return this.historyEvents;
    }

    getSelectedStateEvents() {
        return this.selectedStateEvents;
    }

    getSelectedStreamEvents() {
        return this.selectedStreamEvents;
    }

    selectStream(streamName) {
        if (this.historyEvents.current[streamName]) {
            this.selectedStreamEvents.publish(streamName);
        }
    }

    selectState(streamName,index) {
        console.log(`Tried to select ${streamName}, index ${index}`)
        const selected = { ...this.selectedStateEvents.current, [streamName]:index };
        // tell site about it via message!!
        this.selectedStateEvents.publish(selected);
    }

    sendEvent(newEventPayload) {
        console.log("sending event...");
        alert("oi!");
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { source: "react-state-event-devTool", payload: newEventPayload, debugName: this.selectedStreamEvents.getCurrent()}
            );
        });
    }

    receiveEvent(streamName, newEventPayload) {
        const history = { ...this.historyEvents.getCurrent() }; // hey React, this is new!
        const newEvent = {time: new Date(), payload: newEventPayload };
        if (history[streamName]) { // TODO: potential bug, use HasOwn?
            history[streamName].push(newEvent); // add to existing stream
        }
        else {
            history[streamName] = [newEvent]; // create a new stream
        }
        this.historyEvents.publish(history);
    }

}