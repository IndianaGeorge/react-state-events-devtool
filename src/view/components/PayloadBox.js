import React from 'react';

import Styles from './PayloadBox.module.css';

const PayloadBox = (props)=>(
  <span className={`${Styles.box} ${Styles[props.light]}`}>
    {props.children}
  </span>
)

export default PayloadBox;
