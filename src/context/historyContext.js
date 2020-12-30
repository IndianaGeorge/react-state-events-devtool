import { createContext } from 'react';
import HistoryController from '../controller/HistoryController';

const historyContext = createContext(new HistoryController());

export { historyContext };