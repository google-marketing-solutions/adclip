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

import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import Button from '../../components/Button';
import {getDownloadURL, getMetadata, getStorage, ref} from 'firebase/storage';
import Video from '../../components/Video';
import styles from './index.module.sass';

export default function VideoViewer() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFullPath, setVideoFullPath] = useState('');
  const [metadata, setMetadata] = useState(null);

  const goToHomePage = () => {
    router.push('/');
  };

  const getFileDetails = async (fullPath) => {
    const itemRef = ref(getStorage(), fullPath);
    getDownloadURL(itemRef).then((url) => {
      setVideoUrl(url);
    });
    getMetadata(itemRef).then((metadata) => {
      setMetadata(metadata);
    });
  };

  useEffect(() => {
    if (!router.isReady) return;
    setVideoFullPath(router.query.videoFullPath);
    getFileDetails(router.query.videoFullPath).catch(console.error);
  }, [router.isReady, router.query]);

  return (
    <>
      <h2>{metadata && metadata.name}</h2>
      <div className={styles.videoContainer}>
        <Video
          isLoading={videoUrl === ''}
          name={metadata && metadata.name}
          source={videoUrl}
          fullPath={videoFullPath}
          duration={null}
        />
      </div>
      <div className={styles.actionContainer}>
        <Button onClick={goToHomePage}>Go to Homepage</Button>
      </div>
    </>
  );
}
