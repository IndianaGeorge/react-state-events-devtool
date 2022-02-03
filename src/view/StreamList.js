import React, { useContext } from 'react';
import { useStateEvents } from 'react-state-events';
import { historyContext } from '../context/historyContext';

import Styles from './StreamList.module.css';

const StreamList = (props)=>{
  const Controller = useContext(historyContext);
  const [streamNames] = useStateEvents(Controller.getStreamListEvents());
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const select = (index)=>{
    Controller.selectStream(index);
  }

  return (
    <ol className={Styles.container}>
      {
        streamNames.map((streamName,index)=>(
          <div
            className={`${Styles.item} ${index===selectedStream?Styles.selected:Styles.notSelected}`}
            key={index}
            onClick={()=>select(index)}
          >
            <div
              className={`${Styles.button}`}
            >
              {`${index}: ${streamName}`}
            </div>
          </div>
        ))
      }
    </ol>
  )
}

export default StreamList;
