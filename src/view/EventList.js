import React, { useContext, useEffect } from 'react';
import { useStateEvents } from 'react-state-events';
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

const StreamList = ({ pasteCb })=>{
  const Controller = useContext(historyContext);
  const [stateEvents] = useStateEvents(Controller.getEventListEvents());
  const [selected] = useStateEvents(Controller.getSelectedStateEvents());
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());

  useEffect(()=>{
    Controller.init();
  },[Controller]);
  const select = (index, content)=>{
    Controller.selectState(selectedStream.type, selectedStream.index, index);
    pasteCb(content);
  }
  return (
    <ol className={Styles.eventList}>
      {
        selectedStream? stateEvents.map((stateEvent,index)=>{
          const content = JSON.stringify(stateEvent.payload,null,2);
          return (
            <li className={Styles.eventLine} key={index} onClick={()=>select(index, content)}>
              <Clock light={index>selected?'dim':'normal'}>{msToTimeString(stateEvent.time)}</Clock>
              <PayloadBox light={index>selected?'dim':'normal'}>{content}</PayloadBox>
            </li>
          );
        }) : null
      }
    </ol>
  )
}

export default StreamList;
