import styles from './index.module.sass';
import {useRouter} from 'next/router';
import TranscriptsContainer from './TranscriptsContainer';

function TranscriptReview() {
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;

  return (
    <div className={styles.transcriptReviewContainer}>
      <h2>Review Video Transcription</h2>
      <h3>{videoFullPath}</h3>
      <p>
        Please review and edit the video transcript as needed to ensure
        accuracy.
      </p>
      <main>
        <TranscriptsContainer />
        <br />
      </main>
    </div>
  );
}

export default TranscriptReview;
