import React, { useState, useContext } from 'react';
import { useStateEvents } from 'react-state-events';
import { historyContext } from '../context/historyContext';
import Clock from './components/Clock';
import PayloadBox from './components/PayloadBox';

import Styles from './EventList.module.css';

const StreamList = (props)=>{
  const Controller = useContext(historyContext);
  const [history] = useStateEvents(Controller.getHistoryEvents());
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const [selected,setSelected] = useState(null);
  const select = (index)=>{
    setSelected(index);
    // tell site about it!
  }
  return (
    <ol className={Styles.eventList}>
      {
        selectedStream? history[selectedStream].map((event,index)=><div className={Styles.eventLine}>
          <Clock lit={true}>{event.time}</Clock>
          <PayloadBox>{JSON.stringify(event.payload)}</PayloadBox>
        </div>) : null
      }
    </ol>
  )
}

export default StreamList;
