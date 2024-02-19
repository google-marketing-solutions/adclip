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

import {useEffect, useRef} from 'react';
import Button from '../../components/Button';
import Store from '../../store/AdClipStore';
import styles from './TopicReview.module.sass';
import {useRouter} from 'next/router';
import VideoReference from '../../components/VideoReference';
import TranscriptsContainer from './TranscriptsContainer';

function TranscriptTopicReview() {
  const store = Store.useStore();
  const router = useRouter();
  const isTranscribingVideo = store.get('isTranscribingVideo');
  const transcriptionError = store.get('transcriptionError');
  const inputVideoFullPath = store.get('inputVideoFullPath');
  const playerRef = useRef(null);

  useEffect(() => {
    if (inputVideoFullPath != null) {
      store.set('isTranscribingByTopic')(true);
    }
  }, [inputVideoFullPath]);

  const summarizeTranscript = () => {
    store.set('isSummarizingByTopic')(true);
    router.push('/summaryReview/' + encodeURIComponent(inputVideoFullPath));

    setTimeout(() => {
      store.set('isSummarizingByTopic')(false);
    }, 5000);
  };

  return (
    <div className={styles.transcriptReviewContainer}>
      <h2>Review Video Transcription with Topics</h2>
      <p>Please select Topics or Lines that you want to include in summary.</p>
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
          <br />
        </div>
        <div>
          <p>Video Reference</p>
          <VideoReference ref={playerRef} />
          <div className={styles.nextButtonContainer}>
            <Button
              disabled={isTranscribingVideo}
              isSecondary={false}
              onClick={summarizeTranscript}>
              Summarize Transcript
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TranscriptTopicReview;
