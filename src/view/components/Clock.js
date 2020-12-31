import React from 'react';

import Styles from './Clock.module.css';

const Clock = (props)=>(
  <span className={`${Styles.clockface} ${props.lit?Styles.lit:Styles.unlit}`}>
    {props.children}
  </span>
)

export default Clock;
