import React from 'react';

import Styles from './Clock.module.css';

const Clock = (props)=>(
  <span className={`${Styles.clockface} ${Styles[props.light+'Face']}`}>
    <span className={`${Styles.clockNumbers} ${Styles[props.light+'Numbers']}`}>
      {props.children}
    </span>
  </span>
)

export default Clock;
