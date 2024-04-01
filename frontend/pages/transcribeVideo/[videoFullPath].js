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

import {useEffect, useRef, useState} from 'react';
import styles from './index.module.sass';
import Head from 'next/head';
import {useRouter} from 'next/router';
import TranscriptsContainer from './TranscriptsContainer';
import VideoReference from '../../components/VideoReference';
import SummaryInputs from '../../components/SummaryInputs';
import Store from '../../store/AdClipStore';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';

function TranscriptReview() {
  const store = Store.useStore();
  const router = useRouter();
  const isTranscribingVideo = store.get('isTranscribingVideo');
  const transcriptionError = store.get('transcriptionError');
  const playerRef = useRef(null);
  const filename = store.get('inputVideoFilename');
  const inputVideoFullPath = store.get('inputVideoFullPath');

  const title = `${filename != null && filename + ' | '}Transcript Review`;

  useEffect(() => {
    if (inputVideoFullPath != null) {
      store.set('isTranscribingVideo')(true);
    }
  }, [inputVideoFullPath]);

  const summarizeTranscript = () => {
    router.push(
      '/summaryReview/' + encodeURIComponent(inputVideoFullPath) + '/general/',
    );
  };
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className={styles.transcriptReviewContainer}>
        <h2>Review Video Transcription</h2>
        <h3>{filename}</h3>
        <p>
          Please review and edit the video transcript as needed to ensure
          accuracy.
        </p>
        <main>
          <div>
            {transcriptionError != null ? (
              <div className={styles.error}>
                Transcription failed.
                <p>
                  <em>{transcriptionError.name}</em>
                </p>
                <p>
                  <em>{transcriptionError.cause}</em>
                </p>
                <p>
                  <em>{transcriptionError.message}</em>
                </p>
              </div>
            ) : (
              <TranscriptsContainer playerRef={playerRef} />
            )}
          </div>
          <div>
            <p>Video Reference</p>
            <VideoReference ref={playerRef} />
            <div className={styles.nextButtonContainer}>
              <SummaryInputs
                disabled={isTranscribingVideo}
                onSubmit={summarizeTranscript}
                submitText="Summarize Transcript"
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default TranscriptReview;
