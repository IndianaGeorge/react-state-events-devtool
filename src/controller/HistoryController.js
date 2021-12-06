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
            "stream 3" : [
                {time: 1638741900000, payload: "These are just"},
                {time: 1638741960000, payload: "Strings, there are"},
                {time: 1638742020000, payload: "No restrictions"},
                {time: 1638742080000, payload: "on data type for"},
                {time: 1638742140000, payload: "payload data so you"},
                {time: 1638742200000, payload: "can use whatever"},
                {time: 1638742284000, payload: "suits you best"},
            ],
            "stream 4" : [
                {time: 1638741900000, payload: "Adding a ton of streams"},
                {time: 1638741960000, payload: "To make a multi line panel"},
            ],
            "Testing 123" : [
                {time: 1638741900000, payload: "Whatever"},
            ],
            "Empty Stream" : [
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