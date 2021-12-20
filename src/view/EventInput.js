import React, { useContext, useState } from 'react';

import { historyContext } from '../context/historyContext';

import Styles from './EventInput.module.css';

function EventInput() {
  const Controller = useContext(historyContext);
  const [value, setValue] = useState("");

  const onAdd = () => {
    try {
      Controller.addEvent(value);
      setValue('');
    }
    catch {
      console.error("Tried to set invalid JSON or stream");
    }
  };

  const onChange = (data) => {
    setValue(data.target.value);
  };

  return (
    <div className={Styles.main}>
      <textarea
        className={Styles.textarea}
        rows="3"
        value={value}
        onChange={onChange}
      />
      <button
        className={Styles.addButton}
        onClick={onAdd}
      >
        Add
      </button>
    </div>
  );
}

export default EventInput;