import React, { useContext, useState } from 'react';

import { historyContext } from '../context/historyContext';
import { useStateEvents } from 'react-state-events';

import Styles from './EventInput.module.css';

function EventInput() {
  const Controller = useContext(historyContext);
  const [selectedStream] = useStateEvents(Controller.getSelectedStreamEvents());
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  const onAdd = () => {
    try {
      Controller.sendEvent(selectedStream.type, selectedStream.index, JSON.parse(value));
      setValue('');
    }
    catch {
      console.error("Tried to set invalid JSON or stream");
      setInvalid(true);
    }
  };

  const onInput = (data) => {
    setValue(data.target.value);
    setInvalid(false);
  };

  return (
    <div className={Styles.main}>
      <textarea
        className={`${Styles.textarea} ${invalid && Styles.invalidInput}`}
        rows="3"
        value={value}
        onInput={onInput}
        placeholder="Create a new event from JSON"
      />
      <button
        className={Styles.addButton}
        onClick={onAdd}
      >
        Create
      </button>
    </div>
  );
}

export default EventInput;
