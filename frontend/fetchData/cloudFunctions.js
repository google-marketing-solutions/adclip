import {getFunctions, httpsCallable} from 'firebase/functions';
import {createFirebaseApp} from '../firebase/clientApp';

const APP = createFirebaseApp();
const TRANSCRIBE_VIDEO_FUNCTION = 'transcribe_video';
const SIXTY_MINUTES_IN_MS = 3600000;

const functions = getFunctions(APP);

export const callTranscribeVideo = httpsCallable(
  functions,
  TRANSCRIBE_VIDEO_FUNCTION,
  {timeout: SIXTY_MINUTES_IN_MS},
);
