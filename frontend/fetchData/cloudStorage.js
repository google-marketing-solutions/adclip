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

import {getMetadata, getStorage, ref, listAll} from 'firebase/storage';
import {createFirebaseApp} from '../firebase/clientApp';

const INPUT_VIDEOS_FOLDER = 'videos/';
const OUTPUT_FOLDER_NAME = 'output';
const APP = createFirebaseApp();

const STORAGE = getStorage(APP);
const getFilesFromStorage = async () => {
  const listRef = ref(STORAGE, INPUT_VIDEOS_FOLDER);
  const files = [];

  const promises = [];
  const getFileDetails = async (ref) => {
    const res = await listAll(ref);
    promises.push(
      ...res.items.map((itemRef) =>
        getMetadata(itemRef).then((fileMetadata) => files.push(fileMetadata)),
      ),
    );
    for (const folderRef of res.prefixes) {
      if (folderRef.name !== OUTPUT_FOLDER_NAME)
        await getFileDetails(folderRef);
    }
  };
  await getFileDetails(listRef);
  await Promise.all(promises);
  console.log(files);
  return files;
};

export const getVideosFromStorage = async () => {
  const files = await getFilesFromStorage();
  return files.filter((file) => file.contentType.includes('video'));
};

export const getFilenameFromFullPath = (fullPath) => {
  if (fullPath == null) return null;
  const filePathArr = fullPath.split('/');
  return filePathArr[filePathArr.length - 1];
};
