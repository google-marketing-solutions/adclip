import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  files: [],
  isFetchingFiles: false,
  reviewTranscripts: [],
  selectedFilesForUpload: [],
  selectedVideoFullPath: null,
  transcriptionError: null,
};

export default createConnectedStore(initialState, effects);
