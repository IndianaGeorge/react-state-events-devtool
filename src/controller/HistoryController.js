import { StateEvents } from 'react-state-events'

export default class HistoryController {
    constructor() {
        this.history = {
            "test stream" : [
                {time: "01:31", payload: {such:"events"} },
                {time: "01:32", payload: {such:"unfold"} },
            ],
            "alt stream" : [
                {time: "01:33", payload: {now:"something"} },
                {time: "01:34", payload: {now:"different"} },
            ],
        };
        this.historyEvents = new StateEvents(this.history);
        this.selectedStreamEvents = new StateEvents(null);
    }

    getHistoryEvents() {
        return this.historyEvents;
    }

    getSelectedStreamEvents() {
        return this.selectedStreamEvents;
    }

    selectStream(streamName) {
        this.selectedStreamEvents.publish(streamName);
    }

    addEvent() {
        const history = this.history
        this.history = { ...history };
        this.historyEvents.publish(this.history);
    }
}