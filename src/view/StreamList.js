import React, { useContext, useState } from 'react';
import { useStateEvents } from 'react-state-events';
import { historyContext } from '../context/historyContext';

import Styles from './StreamList.module.css';

const StreamList = ()=>{
  const Controller = useContext(historyContext);
  const [StreamsAndNames] = useStateEvents(Controller.getStreamListEvents());
  const { allStreamsList, allStreamsNames } = StreamsAndNames;
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const [selectedType, setSelectedType] = useState(null);
  const streamTypes = Object.keys(allStreamsList);
  const selectedStreamList = Object.hasOwn(allStreamsList,selectedType)?allStreamsList[selectedType]:[];
  const selectStream = (streamId)=>{
    Controller.selectStream(selectedType, streamId);
  };
  const selectType = (type)=>{
    if (Object.hasOwn(allStreamsList,type)) {
      setSelectedType(type); // selected the stream type
    } else {
      if (streamTypes.length > 0) {
        setSelectedType(streamTypes[0]); // selected type not found, selecting the first
      } else {
        setSelectedType(null); // no types found, no selection
      }
    }
  };

  return (
    <div>
      <div>
        <ul className={Styles.topSelector}>
          {
            streamTypes.map((type)=>(
              <button onClick={()=>selectType(type)} className={`${Styles.topItem} ${type===selectedType?Styles.selected:(type===selectedStream?.type?Styles.active:'')}`}>
                {`${type}`}
              </button>
            ))
          }
        </ul>
      </div>
      <div>
        <ol className={Styles.eventsContainer}>
          {
            selectedStreamList.map((streamId,index)=>(
              <div
                className={`${Styles.streamItem} ${(selectedType===selectedStream?.type && streamId===selectedStream?.index)?Styles.selected:''}`}
                key={index}
                onClick={()=>selectStream(streamId)}
              >
                <div
                  className={`${Styles.streamButton}`}
                >
                  {`${allStreamsNames[selectedType]?.[streamId] || streamId}`}
                </div>
              </div>
            ))
          }
        </ol>
      </div>
    </div>
  )
}

export default StreamList;
