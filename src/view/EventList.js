// Hideous hint for linter so chrome is recognized as a global variable
/* global chrome */


import React, { useContext, useState } from 'react';
import { useStateEvents } from 'react-state-events';
import { useEffect } from 'react/cjs/react.production.min';
import { historyContext } from '../context/historyContext';
import Clock from './components/Clock';
import PayloadBox from './components/PayloadBox';

import Styles from './EventList.module.css';

const msToTimeString = (ms)=>{
  const time = new Date(ms);
  return `${pad(time.getHours(),2)}:${pad(time.getMinutes(),2)}:${pad(time.getSeconds(),2)}`;
}

const pad = (number,digits)=>{
  const text = `${number}`;
  return text.padStart(digits, '0');
}

const handleBackgroundMessage = (parm) => {
  console.log('----------Got message from BG-----------');
  console.log(parm)
};

const StreamList = ()=>{
  const Controller = useContext(historyContext);
  const [stateEvents] = useStateEvents(Controller.getEventListEvents());
  const [selected] = useStateEvents(Controller.getSelectedStateEvents());
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const selectedState = selectedStream?selected[selectedStream]:null;
  // alert (`Redrawing with stateEvents containing ${stateEvents.length} events`);

  useEffect(()=>{
    alert("Before port");
    const port = chrome.runtime.connect({name: 'react-state-event-devtool_connection'});
    Controller.setPort(port);
    Controller.requestStreamList();
  },[]);
  const select = (index)=>{
    Controller.selectState(selectedStream,index);
  }
  return (
    <ol className={Styles.eventList}>
      {
        selectedStream? stateEvents.map((stateEvent,index)=>(
          <li className={Styles.eventLine} key={index} onClick={()=>select(index)}>
            <Clock lit={index===selectedState}>{msToTimeString(stateEvent.time)}</Clock>
            <PayloadBox selected={index===selectedState}>{JSON.stringify(stateEvent.payload,null,2)}</PayloadBox>
          </li>
        )) : null
      }
    </ol>
  )
}

export default StreamList;
