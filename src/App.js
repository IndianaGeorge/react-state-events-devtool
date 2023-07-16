import React from 'react';
import StreamList from './view/StreamList';
import EventList from './view/EventList';
import EventInput from './view/EventInput';

import Styles from './App.module.css';

const { useRef } = React;

function App() {
  const inputRef = useRef();
  const pasteToInput = (value) => {
    inputRef.current.paste(value)
  };

  return (
    <div className={`${Styles.main}`}>
      <StreamList />
      <div className={`${Styles.eventList}`} >
        <EventList pasteCb={pasteToInput} />
      </div>
      <EventInput ref={inputRef} />
    </div>
  );
}

export default App;
