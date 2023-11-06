import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  files: [],
  isFetchingFiles: false,
};

export default createConnectedStore(initialState, effects);
