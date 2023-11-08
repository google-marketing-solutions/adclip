import {useRef} from 'react';
import styles from './index.module.sass';
import Head from 'next/head';
import {useRouter} from 'next/router';
import TranscriptsContainer from './TranscriptsContainer';
import VideoReference from '../../components/VideoReference';
import DurationInput from '../../components/DurationInput';
import Store from '../../store/AdClipStore';

const getFilenameFromFullPath = (fullPath) => {
  if (fullPath == null) return null;
  const filePathArr = fullPath.split('/');
  return filePathArr[filePathArr.length - 1];
};

function TranscriptReview() {
  const store = Store.useStore();
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;
  const isTranscribingVideo = store.get('isTranscribingVideo');
  const playerRef = useRef(null);

  const filename = getFilenameFromFullPath(videoFullPath);

  return (
    <>
      <Head>
        <title>{filename}</title>
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
            <TranscriptsContainer playerRef={playerRef} />
            <br />
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
