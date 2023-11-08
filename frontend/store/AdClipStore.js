import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  files: [],
  isFetchingFiles: false,
  isGettingOriginalVideoUrl: false,
  isTranscribingVideo: false,
  isTranscriptInEdit: false,
  maxDuration: 40,
  minDuration: 20,
  reviewTranscripts: [],
  reviewVideo: '',
  selectedFilesForUpload: [],
  selectedVideoFullPath: null,
  transcriptionError: null,
};

export default createConnectedStore(initialState, effects);
