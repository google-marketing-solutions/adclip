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

import {getFirestore, setDoc, doc} from 'firebase/firestore';
import {useEffect, useRef, useState} from 'react';
import {useUser} from '../context/userContext';
import styles from './index.module.sass';
import {
  getFilenameFromFullPath,
  getVideosFromStorage,
} from '../fetchData/cloudStorage';
import Shimmer from '../components/Shimmer';
import clsx from 'clsx';
import Store from '../store/AdClipStore';
import Input from '../components/Input';
import Button from '../components/Button';
import {useRouter} from 'next/navigation';

const humanFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes < 1024) {
    return `${bytes} ${sizes[0]}`;
  } else if (bytes < 1048576) {
    return `${(bytes / 1024).toFixed(2)} ${sizes[1]}`;
  } else if (bytes < 1073741824) {
    return `${(bytes / 1048576).toFixed(2)} ${sizes[2]}`;
  } else if (bytes < 1099511627776) {
    return `${(bytes / 1073741824).toFixed(2)} ${sizes[3]}`;
  }
  return `${(bytes / 1099511627776).toFixed(2)} ${sizes[4]}`;
};

const languages = {
  'en-US': 'English',
  'th-TH': 'Thai',
  'zh-TW': 'Chinese (Traditional)',
};

export default function Home() {
  const store = Store.useStore();
  const {loadingUser, user} = useUser();
  const router = useRouter();
  const files = store.get('files');
  const isFetchingFiles = store.get('isFetchingFiles');
  const selectedVideoFullPath = store.get('selectedVideoFullPath');
  const [filenameFilter, setFilenameFilter] = useState('');
  const uploadInputRef = useRef();
  const language = store.get('language');
  const setLanguage = store.set('language');

  useEffect(() => {
    if (loadingUser || user == null) return;

    store.set('isFetchingFiles')(true);
    getVideosFromStorage().then((newFiles) => {
      store.set('files')(newFiles);
      store.set('isFetchingFiles')(false);
    });
  }, [loadingUser, user]);

  const onChangeFileInput = (event) => {
    store.set('selectedFilesForUpload')(event.target.files);
    store.set('isFetchingFiles')(true);
    setFilenameFilter('');
  };

  const FileRow = ({file}) => {
    const isSelected = store.get('selectedVideoFullPath') === file.fullPath;
    const onClick = () => {
      store.set('selectedVideoFullPath')(file.fullPath);
    };

    return (
      <tr
        className={clsx(styles.fileContainer, isSelected && styles.selected)}
        key={file.md5Hash}
        onClick={onClick}>
        <td>{file.name}</td>
        <td>{humanFileSize(file.size)}</td>
        <td>
          {new Date(file.updated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}{' '}
          {new Date(file.updated).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </td>
      </tr>
    );
  };

  const transcribeVideo = () => {
    store.set('transcriptionError')(null);
    router.push('transcribeVideo/' + encodeURIComponent(selectedVideoFullPath));
  };

  const filteredFiles = files
    .filter((file) =>
      file.name.toLowerCase().includes(filenameFilter.toLowerCase()),
    )
    .sort((a, b) => new Date(b.updated) - new Date(a.updated));

  return (
    <div>
      <main className={styles.mainContainer}>
        <h2>Select a video file</h2>
        <p>
          AdClip currently accepts videos with voice-over in English, Thai, and
          Traditional Chinese (maximum 2250 words).
        </p>
        <div className={styles.selectContainer}>
          <div className={styles.toolbar}>
            <Input
              type="text"
              className={styles.filenameFilter}
              placeholder="Search"
              value={filenameFilter}
              onChange={setFilenameFilter}
            />
            <input
              type="file"
              accept="video/*"
              style={{display: 'none'}}
              ref={uploadInputRef}
              onChange={onChangeFileInput}
            />
            <Button
              isSecondary
              onClick={() => {
                uploadInputRef.current.click();
              }}>
              Upload video
            </Button>
          </div>
          <div className={styles.filesTableContainer}>
            <table className={styles.filesTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <FileRow file={file} key={file.md5Hash} />
                ))}
                {!isFetchingFiles && filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan="100%">
                      <div style={{paddingLeft: '0.5rem'}}>
                        No files found for &quot;{filenameFilter}&quot;
                      </div>
                    </td>
                  </tr>
                )}
                {isFetchingFiles && (
                  <tr>
                    <td>
                      <Shimmer />
                    </td>
                    <td>
                      <Shimmer />
                    </td>
                    <td>
                      <Shimmer />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.actionContainer}>
            <div className={styles.languageContainer}>
              <label>Video language:</label>
              <select onChange={(e) => setLanguage(e.target.value)}>
                {Object.keys(languages).map((languageCode) => (
                  <option
                    value={languageCode}
                    selected={languageCode === language}>
                    {languages[languageCode]}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={transcribeVideo}
              disabled={selectedVideoFullPath == null}>
              Start
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
