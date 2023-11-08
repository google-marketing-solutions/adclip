import styles from './index.module.sass';
import {useRouter} from 'next/router';
import TranscriptsContainer from './TranscriptsContainer';
import VideoReference from '../../components/VideoReference';
import DurationInput from '../../components/DurationInput';
import Store from '../../store/AdClipStore';

function TranscriptReview() {
  const store = Store.useStore();
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;
  const isTranscribingVideo = store.get('isTranscribingVideo');

  return (
    <div className={styles.transcriptReviewContainer}>
      <h2>Review Video Transcription</h2>
      <h3>{videoFullPath}</h3>
      <p>
        Please review and edit the video transcript as needed to ensure
        accuracy.
      </p>
      <main>
        <div>
          <TranscriptsContainer />
          <br />
        </div>
        <div>
          <p>Video Reference</p>
          <VideoReference />
          <div className={styles.nextButtonContainer}>
            <DurationInput
              disabled={isTranscribingVideo}
              submitText="Summarize Transcript"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default TranscriptReview;
