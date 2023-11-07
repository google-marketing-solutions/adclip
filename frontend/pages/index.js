import {getFirestore, setDoc, doc} from 'firebase/firestore';
import Head from 'next/head';
import {useEffect, useRef, useState} from 'react';
import {useUser} from '../context/userContext';
import styles from './index.module.sass';
import {getVideosFromStorage} from '../fetchData/cloudStorage';
import Shimmer from '../components/Shimmer';
import clsx from 'clsx';
import Store from '../store/AdClipStore';
import Input from '../components/Input';
import Button from '../components/Button';

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

export default function Home() {
  const store = Store.useStore();
  const {loadingUser, user} = useUser();
  const files = store.get('files');
  const isFetchingFiles = store.get('isFetchingFiles');
  const [filenameFilter, setFilenameFilter] = useState('');
  const uploadInputRef = useRef();

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
    return (
      <tr className={clsx(styles.fileContainer)} key={file.md5Hash}>
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

  const filteredFiles = files
    .filter((file) =>
      file.name.toLowerCase().includes(filenameFilter.toLowerCase()),
    )
    .sort((a, b) => new Date(b.updated) - new Date(a.updated));

  return (
    <div>
      <Head>
        <title>AdClip</title>
        <link rel="icon" href="/adclip.ico" />
      </Head>

      <main>
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
                        No files found for "{filenameFilter}"
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
        </div>
      </main>
    </div>
  );
}
