import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  files: [],
  isFetchingFiles: false,
  selectedFilesForUpload: [],
};

export default createConnectedStore(initialState, effects);
