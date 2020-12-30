import React, { useState, useContext } from 'react';
import { useStateEvents } from 'react-state-events';
import { historyContext } from '../context/historyContext';

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
    <ol>
      {
        selectedStream? history[selectedStream].map((event,index)=><div>{`${event.time} | ${JSON.stringify(event.payload)}`}</div>) : null
      }
    </ol>
  )
}

export default StreamList;
