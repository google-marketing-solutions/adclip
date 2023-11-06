import {getFirestore, setDoc, doc} from 'firebase/firestore';
import Head from 'next/head';
import {useEffect, useState} from 'react';
import {useUser} from '../context/userContext';
import styles from './index.module.sass';
import {getVideosFromStorage} from '../fetchData/cloudStorage';
import clsx from 'clsx';

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
  // Our custom hook to get context values
  const {loadingUser, user} = useUser();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (loadingUser || user == null) return;

    getVideosFromStorage().then((newFiles) => {
      setFiles(newFiles);
    });
  }, [loadingUser, user]);

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

  return (
    <div>
      <Head>
        <title>AdClip</title>
        <link rel="icon" href="/adclip.ico" />
      </Head>

      <main>
        <div className={styles.selectContainer}>
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
                {files.map((file) => (
                  <FileRow file={file} key={file.md5Hash} />
                ))}
                {files.length === 0 && (
                  <tr>
                    <td colSpan="100%">
                      <div style={{paddingLeft: '0.5rem'}}>No files found</div>
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
