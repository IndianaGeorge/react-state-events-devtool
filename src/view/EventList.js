import React, { useContext, useState } from 'react';
import { useStateEvents } from 'react-state-events';
import { historyContext } from '../context/historyContext';
import Clock from './components/Clock';
import PayloadBox from './components/PayloadBox';

import Styles from './EventList.module.css';

const StreamList = (props)=>{
  const Controller = useContext(historyContext);
  const [history] = useStateEvents(Controller.getHistoryEvents());
  const [selected] = useStateEvents(Controller.getSelectedStateEvents());
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const selectedState = selectedStream?selected[selectedStream]:null;

  const select = (index)=>{
    Controller.selectState(selectedStream,index);
  }
  return (
    <ol className={Styles.eventList}>
      {
        selectedStream? history[selectedStream].map((event,index)=>(
          <li className={Styles.eventLine} key={index} onClick={()=>select(index)}>
            <Clock lit={index===selectedState}>{event.time}</Clock>
            <PayloadBox selected={index===selectedState}>{JSON.stringify(event.payload,null,2)}</PayloadBox>
          </li>
        )) : null
      }
    </ol>
  )
}

export default StreamList;
