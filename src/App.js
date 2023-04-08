import React from 'react';
import StreamList from './view/StreamList';
import EventList from './view/EventList';
import EventInput from './view/EventInput';

import Styles from './App.module.css';

function App() {
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
