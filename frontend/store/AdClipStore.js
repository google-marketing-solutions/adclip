import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  areTimestampsInEdit: false,
  files: [],
  isFetchingFiles: false,
  isGettingOriginalVideoUrl: false,
  isSummarizingTranscript: false,
  isTranscribingVideo: false,
  isTranscriptInEdit: false,
  maxDuration: 40,
  minDuration: 20,
  reviewTranscripts: [],
  reviewVideo: '',
  selectedFilesForUpload: [],
  selectedVideoFullPath: null,
  summarizedTranscripts: [],
  transcriptionError: null,
};

export default createConnectedStore(initialState, effects);
