import styles from './index.module.sass';
import {useRouter} from 'next/router';
import TranscriptsContainer from './TranscriptsContainer';
import VideoReference from '../../components/VideoReference';

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
        <div>
          <TranscriptsContainer />
          <br />
        </div>
        <div>
          <p>Video Reference</p>
          <VideoReference />
        </div>
      </main>
    </div>
  );
}

export default TranscriptReview;
