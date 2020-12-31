import React from 'react';

import Styles from './PayloadBox.module.css';

const PayloadBox = (props)=>(
  <span className={`${Styles.box} ${props.selected?Styles.selected:Styles.unselected}`}>
    {props.children}
  </span>
)

export default PayloadBox;
