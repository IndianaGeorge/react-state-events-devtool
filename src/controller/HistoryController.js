import { StateEvents } from 'react-state-events'

export default class HistoryController {
    constructor() {
        const history = {
            "test stream" : [
                {time: 1638678660000, payload: {such:"events"} },
                {time: 1638678720000, payload: {such:"unfold"} },
            ],
            "alt stream" : [
                {time: 1638678780000, payload: {now:"something"} },
                {time: 1638678840000, payload: {now:"different"} },
                {time: 1638678900000, payload: {now:"This is just a really long line so we can see how wrapping works when this entry is selected or not selected. It should be fully visible when selected, but collapsed to a single line when not selected. Not sure if this will be a smooth transition ot just a jump cut like the default is for these things.", alt:"and this is to see it formatted"} },
            ],
        };
        const selected = {
            "test stream": 1,
            "alt stream":  2,
        };
        const streamList = Object.keys(selected);
        const selectedStream = streamList.length===0?null:streamList[0];
        this.historyEvents = new StateEvents(history);
        this.selectedStateEvents = new StateEvents(selected);
        this.selectedStreamEvents = new StateEvents(selectedStream);
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

    addEvent() {
        const history = { ...this.historyEvents.current }; // hey React, this is new!
        // add the event??
        this.historyEvents.publish(history); // profit
    }
}