import React, { useContext } from 'react';
import { useStateEvents } from 'react-state-events';
import { historyContext } from '../context/historyContext';

import Styles from './StreamList.module.css';

const StreamList = (props)=>{
  const Controller = useContext(historyContext);
  const [history] = useStateEvents(Controller.getHistoryEvents());
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const streamNames = Object.keys(history);
  const select = (streamName)=>{
    Controller.selectStream(streamName);
  }
  console.log(Styles);
  return (
    <ol className={Styles.container}>
      {
        streamNames.map((streamName,index)=><div className={`${Styles.item}`}>
          <div
            onClick={()=>select(streamName)}
            className={`${Styles.button} ${streamName===selectedStream?Styles.selected:Styles.notSelected}`}
            key={index}
          >
            {streamName}
          </div>
        </div>)
      }
    </ol>
  )
}

export default StreamList;
