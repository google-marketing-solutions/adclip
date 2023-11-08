import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  files: [],
  isFetchingFiles: false,
  isTranscribingVideo: false,
  reviewTranscripts: [],
  reviewVideo: '',
  selectedFilesForUpload: [],
  selectedVideoFullPath: null,
  transcriptionError: null,
};

export default createConnectedStore(initialState, effects);
