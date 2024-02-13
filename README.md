# react-state-event-devtool

A Chrome devtools extension for [react-state-events](github.com/indianaGeorge/react-state-events)

# Developer documentation

## Message sequence: Initializing the panel
_Use case: the devTool panel is opened_

* Popup requests a list of streams
* Background responds with the list
* Popup requests the full history of the first stream if there is any
* Background responds with the full history of the stream

```mermaid
sequenceDiagram
    participant Popup
    participant Background
    Popup->>+Background: List
    Background-->>-Popup: List of streams by type
    Popup->>+Background: Get(StateEvents, 0)
    Background-->>-Popup: list of events
```
---
## Message sequence: Changing stream
_Use case: one of the stream buttons in the devTool panel is clicked_

* Popup requests the full history of the stream with the id that was clicked
* Background responds with the full history of the stream

```mermaid
sequenceDiagram
    participant Popup
    participant Background
    Popup->>+Background: Get(StateEvents, 0)
    Background-->>-Popup: list of events
```

---
## Message sequence: Updating with a new SET
_Use case: a valid JSON state is typed in the field and the button is clicked_

* Popup sends a new state to background
* Background responds with same message (update) to popup, to confirm
* Background sends a new state to content injected in current tab

```mermaid
sequenceDiagram
    participant Popup
    participant Background
    participant Content
    participant Current tab
    Popup->>+Background: Update(streamType, streamId, value)
    Background-->>-Popup: Update(streamType, streamId, value, at)
    Background->>+Content: Update(streamType, streamId, value)
    Content->>+Current tab: type, id, payload
```

---
## Message sequence: Setting state to history entry
_Use case: A previous entry in the history list is clicked_

* Popup sends a SET message with the history index to use
* Background responds with the same message (set) to popup, to confirm
* Background sends the state in the history entry to content injected in current tab

```mermaid
sequenceDiagram
    participant Popup
    participant Background
    participant Content
    participant Current tab
    Popup->>+Background: Set(streamType, streamId, index)
    Background-->>-Popup: Set(streamType, streamId, index)
    Background->>+Content: type, id, payload
    Content->>+Current tab: type, id, payload
```

---
## Message format: from DevTools panel to background

These are the different message formats sent from the DevTools panel to the background:

### Set stream to JSON in input field (UPDATE)
```json
{
    "tabId": "currentTabId",
    "action": "update",
    "payload": {
        "streamType": "streamType",
        "streamId": "streamId",
        "value": "newEventPayload",
    }
}
```

### Set stream to state from history (SET)
```json
{
    "tabId": "currentTabId",
    "action": "set",
    "payload": {
        "streamType": "streamType",
        "streamId": "streamId",
        "index": 0,
    }
}
```

### Request full history of stream (GET)
```json
{
    "tabId": "currentTabId",
    "action": "get",
    "payload": {
        "streamType": "streamType",
        "streamId": "streamId",
    }
}
```

### Request current list of streams (LIST)
```json
{
    "tabId": "currentTabId",
    "action": "list"
}
```

---
## Message format: from background to DevTools panel
These are the different message formats sent from the the background to the DevTools panel:

### Response to request full history of stream (GET)
```json
{
    "action": "get",
    "at": 1,
    "payload": [
        {
            "streamType":"streamType",
            "streamId":"streamId",
            "value":"value"
        }
    ]
}
```

### Response to request current list of streams (LIST)
```json
{
    "action": "list",
    "payload": {
        "ExternalStateEvents": ["streamId"],
        "StateEvents": [1],
    }
}
```

### Update from content containing single event
property `at` is optional
```json
{
    "action": "append",
    "payload": {
        "streamType": "message.type",
        "streamId": "message.id",
        "value": "message.payload",
        "at": 0,
    }
}
```

---
## Message format: from content to background
These are the different message formats sent in reaction to an `event` received via a `message` window event in the content injected in the tab. The reaction messages are sent to the background via `chrome.runtime.sendMessage`.
The `event` is required to have `event.source` equal to the same window as the content and `event.origin` equal to the same origin as the content, so it should only come from the same tab where the content was injected.

## When `event.data.type` is `'react-state-event-devTool-streamId'`
```json
{
    "action": "new-stream",
    "type": "StateEvents",
    "id": "event.data.id",
    "payload": "event.data.payload"
}
```

## When `event.data.type` is `'react-state-event-devTool-notify'`
```json
{
    "action": "update",
    "type": "event.data.payload.streamType",
    "id": "event.data.payload.streamId",
    "payload": "event.data.payload.value"
}
```

## When `event.data.type` is `'react-state-event-initrequest'`
```json
{
    "action": "new-stream",
    "type": "ExternalStateEvents",
    "id": "event.data.name",
    "payload": "event.data.name"
}
```

---
## Message format: from content to library
These are the different message formats sent in reaction to a `msg` from background.
The reaction messages are sent to the library in the tab where content was injected and
origin is set to the origin of `msg`.

## When `msg.type` is `'StateEvents'`
```json
{
    "type": "react-state-event-devTool-set",
    "id": "msg.id",
    "payload": "msg.payload"
}
```

## When `msg.type` is `'ExternalStateEvents'`
```json
{
    "type": "react-state-event",
    "name": "msg.id",
    "success": true,
    "payload": "msg.payload"
}
```

---
## Message format: from content to library in tab
These are the different message formats sent in reaction to a `msg` received via a `chrome.runtime.onMessage` listener in the content injected in the tab. The reaction messages are sent within the same tab via `window.postMessage` and the origin is set to the same window.
The `msg` is required to have `msg.origin` equal to `react-state-event-devTool`, to verify it comes from the devTool background.

## When `msg.type` is `'StateEvents'`
```json
{
    "type": "react-state-event-devTool-set",
    "id": "msg.id",
    "payload": "msg.payload"
}
```

## When `msg.type` is `'ExternalStateEvents'`
```json
{
    "type": "react-state-event",
    "name": "msg.id",
    "success": true,
    "payload": "msg.payload"
}
```

# This extension's UI was created with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm run build`

Builds the browser extension for production to the `build` folder.
