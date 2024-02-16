/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {getFunctions, httpsCallable} from 'firebase/functions';
import {createFirebaseApp} from '../firebase/clientApp';

const APP = createFirebaseApp();
const TRANSCRIBE_VIDEO_FUNCTION = 'transcribe_video';
const SUMMARIZE_TRANSCRIPT_FUNCTION = 'summarize_transcript';
const SIXTY_MINUTES_IN_MS = 3600000;

const functions = getFunctions(APP);

export const callTranscribeVideo = httpsCallable(
  functions,
  TRANSCRIBE_VIDEO_FUNCTION,
  {timeout: SIXTY_MINUTES_IN_MS},
);

export const callSummarizeTranscript = httpsCallable(
  functions,
  SUMMARIZE_TRANSCRIPT_FUNCTION,
  {timeout: SIXTY_MINUTES_IN_MS},
);
