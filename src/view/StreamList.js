import React, { useContext } from 'react';
import { useStateEvents } from 'react-state-events';
import { historyContext } from '../context/historyContext';

const StreamList = (props)=>{
  const Controller = useContext(historyContext);
  const [history] = useStateEvents(Controller.getHistoryEvents());
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const streamNames = Object.keys(history);
  const select = (index)=>{
    Controller.selectStream(streamNames[index]);
  }
  return (
    <ol>
      {
        streamNames.map((streamName,index)=><div
          onClick={()=>select(index)}
          className={streamName===selectedStream?'selected':'not-selected'}
          key={index}
        >{streamName}</div>)
      }
    </ol>
  )
}

export default StreamList;
