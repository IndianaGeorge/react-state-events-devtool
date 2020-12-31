import React from 'react';

import Styles from './Clock.module.css';

const Clock = (props)=>(
  <span className={`${Styles.clockface} ${props.lit?Styles.litFace:Styles.unlitFace}`}>
    <span className={`${Styles.clockNumbers} ${props.lit?Styles.litNumbers:Styles.unlitNumbers}`}>
      {props.children}
    </span>
  </span>
)

export default Clock;
