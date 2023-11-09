import styles from './index.module.sass';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';

function SummaryReview() {
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;

  const filename = getFilenameFromFullPath(videoFullPath);

  return (
    <>
      <Head>
        <title>{filename}</title>
      </Head>

      <div className={styles.pageContainer}>
        <h2>Review Summarized Transcript</h2>
      </div>
    </>
  );
}

export default SummaryReview;
