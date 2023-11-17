import {useEffect, useRef, useState} from 'react';
import styles from './index.module.sass';
import Head from 'next/head';
import {useRouter} from 'next/router';
import TranscriptsContainer from './TranscriptsContainer';
import VideoReference from '../../components/VideoReference';
import DurationInput from '../../components/DurationInput';
import Store from '../../store/AdClipStore';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';

function TranscriptReview() {
  const store = Store.useStore();
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;
  const isTranscribingVideo = store.get('isTranscribingVideo');
  const transcriptionError = store.get('transcriptionError');
  const playerRef = useRef(null);
  const filename = store.get('inputVideoFilename');

  const title = `${filename != null && filename + ' | '}Transcript Review`;
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
              <DurationInput
                disabled={isTranscribingVideo}
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
