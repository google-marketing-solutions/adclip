import styles from './index.module.sass';
import {useRouter} from 'next/router';

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
    </div>
  );
}

export default TranscriptReview;
