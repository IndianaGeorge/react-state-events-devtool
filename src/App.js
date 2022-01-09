// Hideous hint for linter so chrome is recognized as a global variable
/* global chrome */

import React, { useEffect, useContext } from 'react';
import { historyContext } from './context/historyContext';
import StreamList from './view/StreamList';
import EventList from './view/EventList';
import EventInput from './view/EventInput';

import Styles from './App.module.css';


function App() {
  const Controller = useContext(historyContext);
  const handleContentMessage = (msg, sender, respFn) => {
    Controller.receiveEvent(msg.debugName, msg.payload);
    return null;
  }
  
  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleContentMessage);
    return () => chrome.runtime.onMessage.removeListener(handleContentMessage);
  }, []);

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
