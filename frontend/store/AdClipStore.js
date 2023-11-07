import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  files: [],
  isFetchingFiles: false,
  selectedFilesForUpload: [],
  selectedVideoFullPath: null,
};

export default createConnectedStore(initialState, effects);
