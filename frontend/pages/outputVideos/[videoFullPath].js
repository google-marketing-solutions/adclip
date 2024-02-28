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

import Head from 'next/head';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';
import Store from '../../store/AdClipStore';
import Button from '../../components/Button';
import Video from '../../components/Video';
import styles from './index.module.sass';

function OutputVideos() {
  const store = Store.useStore();
  const router = useRouter();
  const isGeneratingVideos = store.get('isGeneratingVideos');
  const filename = store.get('inputVideoFilename');
  const videos = store.get('outputVideos');
  const title = `${filename != null && filename + ' | '}Output Videos`;
  const transcripts = store.get('summarizedTranscripts');

  const totalDuration = transcripts.reduce(
    (duration, transcript) =>
      duration + transcript.endTime - transcript.startTime,
    0,
  );
  const goToHomePage = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <h2>Output Videos</h2>
      <p>Thank you for using AdClip!</p>
      {isGeneratingVideos && (
        <div className="loadingEllipsis">Generating video</div>
      )}

      {videos.length > 1 ? (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <div className={styles.videoItem} key={video.fullPath}>
              <Video
                isLoading={isGeneratingVideos}
                source={video.url}
                duration={totalDuration}
                name={filename}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.videoItem}>
          <Video
            isLoading={isGeneratingVideos}
            source={videos.length >= 1 ? videos[0].url : null}
            duration={totalDuration}
            name={filename}
          />
        </div>
      )}

      <div style={{marginTop: '2rem'}}>
        <Button onClick={goToHomePage}>Start Over</Button>
      </div>
    </>
  );
}

export default OutputVideos;
