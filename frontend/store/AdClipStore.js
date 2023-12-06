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
