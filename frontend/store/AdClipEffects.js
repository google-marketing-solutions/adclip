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
import {callTranscribeVideo} from '../fetchData/cloudFunctions';
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
      const selectedVideoFullPath = store.get('selectedVideoFullPath');
      callTranscribeVideo({
        full_path: selectedVideoFullPath,
        file_name: getFilenameFromFullPath(selectedVideoFullPath),
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

  return store;
};

export default effects;
