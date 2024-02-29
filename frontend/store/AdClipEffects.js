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

import {getDownloadURL, getStorage, ref, uploadBytes} from 'firebase/storage';
import {createFirebaseApp} from '../firebase/clientApp';
import {
  callCutVideo,
  callTranscribeVideo,
  callTranscribeByTopic,
  callSummarizeTranscript,
} from '../fetchData/cloudFunctions';
import {getFilenameFromFullPath} from '../fetchData/cloudStorage';

const INPUT_VIDEOS_FOLDER = 'videos/';

const effects = (store) => {
  store.on('selectedFilesForUpload').subscribe((files) => {
    for (const file of files) {
      const storageRef = ref(getStorage(), INPUT_VIDEOS_FOLDER + file.name);
      uploadBytes(storageRef, file).then((snapshot) => {
        const currentFiles = store.get('files');
        store.set('files')([...currentFiles, snapshot.metadata]);
        store.set('isFetchingFiles')(false);
      });
    }
  });

  store.on('isTranscribingVideo').subscribe((isTranscribingVideo) => {
    if (isTranscribingVideo) {
      const inputVideoFullPath = store.get('inputVideoFullPath');
      const language = store.get('language');
      callTranscribeVideo({
        full_path: inputVideoFullPath,
        file_name: getFilenameFromFullPath(inputVideoFullPath),
        language_code: language,
      })
        .then((result) => {
          store.set('isTranscribingVideo')(false);
          store.set('reviewTranscripts')(result.data.transcript);
        })
        .catch((error) => {
          console.error(error);
          store.set('transcriptionError')(error);
        });
    }
  });

  store.on('inputVideoFullPath').subscribe((videoFullPath) => {
    if (videoFullPath != null) {
      store.set('inputVideoURL')(null);
      store.set('inputVideoFilename')(getFilenameFromFullPath(videoFullPath));
      getDownloadURL(ref(getStorage(), videoFullPath)).then((url) => {
        store.set('inputVideoURL')(url);
      });
    }
  });

  store.on('isSummarizingTranscript').subscribe((isSummarizingTranscript) => {
    if (isSummarizingTranscript) {
      const inputVideoFullPath = store.get('inputVideoFullPath');
      const transcripts = store.get('reviewTranscripts');
      const language = store.get('language');
      const minDuration = store.get('minDuration');
      const maxDuration = store.get('maxDuration');
      const textModel = store.get('textModel');
      callSummarizeTranscript({
        filename: getFilenameFromFullPath(inputVideoFullPath),
        transcript: transcripts,
        min_duration: minDuration,
        max_duration: maxDuration,
        language_code: language,
        model_name: textModel,
      })
        .then((result) => {
          const summarizedTranscript = result.data.summarized_transcript;
          store.set('summarizedTranscripts')(summarizedTranscript);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          store.set('isSummarizingTranscript')(false);
        });
    }
  });

  store.on('isTranscribingByTopic').subscribe((isTranscribingByTopic) => {
    if (isTranscribingByTopic) {
      const inputVideoFullPath = store.get('inputVideoFullPath');
      const transcripts = store.get('reviewTranscripts');
      callTranscribeByTopic({
        filename: getFilenameFromFullPath(inputVideoFullPath),
        transcript: transcripts,
      })
        .then((result) => {
          const transcriptWithTopics = result.data;
          // add checked:true to all lines
          Object.keys(transcriptWithTopics).forEach((topic) => {
            Object.keys(transcriptWithTopics[topic]).forEach((lineNumber) => {
              transcriptWithTopics[topic][lineNumber].checked = true;
            });
          });
          store.set('transcriptWithTopics')(transcriptWithTopics);
        })
        .catch((error) => {
          store.set('topicTranscriptionError')(error);
        })
        .finally(() => {
          store.set('isTranscribingByTopic')(false);
        });
    }
  });

  store.on('isGeneratingVideos').subscribe((isGeneratingVideos) => {
    if (isGeneratingVideos) {
      const inputVideoFullPath = store.get('inputVideoFullPath');
      const summarizedTranscripts = store.get('summarizedTranscripts');
      const inputVideoUrl = store.get('inputVideoURL');
      callCutVideo({
        fileName: getFilenameFromFullPath(inputVideoFullPath),
        videoUrl: inputVideoUrl,
        transcript: summarizedTranscripts,
      })
        .then((result) => {
          const {full_path: fullPath, full_path_vertical: fullPathVertical} =
            result.data;
          const promises = [
            getDownloadURL(ref(getStorage(), fullPath)).then((url) => ({
              url,
              fullPath,
            })),
          ];
          if (fullPathVertical) {
            promises.push(
              getDownloadURL(ref(getStorage(), fullPathVertical)).then(
                (url) => ({
                  url,
                  fullPath: fullPathVertical,
                }),
              ),
            );
          }
          Promise.all(promises).then((outputVideos) => {
            store.set('outputVideos')(outputVideos);
          });
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          store.set('isGeneratingVideos')(false);
        });
    }
  });

  return store;
};

export default effects;
