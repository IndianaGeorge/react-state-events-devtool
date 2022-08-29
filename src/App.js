// Hideous hint for linter so chrome is recognized as a global variable
/* global chrome */

import React, { useEffect, useContext } from 'react';
import { historyContext } from './context/historyContext';
import StreamList from './view/StreamList';
import EventList from './view/EventList';
import EventInput from './view/EventInput';

import Styles from './App.module.css';

const port = chrome.runtime.connect({name: 'react-state-event-devtool_connection'});

function App() {
  const Controller = useContext(historyContext);
  useEffect(() => {
    Controller.setPort(port);
    return () => Controller.disconnectPort();
  }, [port]);

  /*
  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleContentMessage);
    alert('popup Added chrome message listener');

    // initial request for existing streams
    Controller.requestStreamList();
    Controller.requestStreamHistory(0);
    console.log("Popup app requesting stream list!");

    return () => chrome.runtime.onMessage.removeListener(handleContentMessage);
  }, []);

  alert('Redrawing App');
*/

  return (
    <div className={`${Styles.main}`}>
      <StreamList />
      <div className={`${Styles.eventList}`} >
        <EventList />
      </div>
      <EventInput />
    </div>
  );
}

export default App;
