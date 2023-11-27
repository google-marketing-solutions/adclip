import {createConnectedStore} from 'undux';
import effects from './AdClipEffects';

const initialState = {
  areTimestampsInEdit: false,
  files: [],
  inputVideoFullPath: null,
  inputVideoURL: null,
  inputVideoFilename: null,
  isFetchingFiles: false,
  isGeneratingVideos: false,
  isSummarizingTranscript: false,
  isTranscribingVideo: false,
  isTranscriptInEdit: false,
  maxDuration: 40,
  minDuration: 20,
  reviewTranscripts: [],
  selectedFilesForUpload: [],
  selectedVideoFullPath: null,
  summarizedTranscripts: [],
  transcriptionError: null,
};

export default createConnectedStore(initialState, effects);
