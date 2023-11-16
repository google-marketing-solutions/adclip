import styles from './index.module.sass';
import Store from '../../store/AdClipStore';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';
import clsx from 'clsx';
import TranscriptRow from '../../components/TranscriptRow';

function SummaryReview() {
  const store = Store.useStore();
  const isSummarizingTranscript = store.get('isSummarizingTranscript');
  const transcripts = store.get('summarizedTranscripts');
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;

  const filename = getFilenameFromFullPath(videoFullPath);

  const totalDuration = transcripts.reduce(
    (duration, transcript) =>
      duration + transcript.endTime - transcript.startTime,
    0,
  );

  return (
    <>
      <Head>
        <title>{filename}</title>
      </Head>

      <div className={styles.pageContainer}>
        <h2>Review Summarized Transcript</h2>
        <p>
          Here is the summarized transcript by AI. Click on the Start and End
          buttons to review each segment and edit the time if needed.
        </p>
        <h4>Total Duration: {totalDuration.toFixed(2)}s</h4>
        <main className={styles.mainContainer}>
          <section className={styles.transcriptContainer}>
            {isSummarizingTranscript ? (
              <p className="loadingEllipsis">
                The transcript is being summarized
              </p>
            ) : (
              <header className={clsx(styles.header, styles.transcriptRow)}>
                <span>Start</span>
                <span>End</span>
                <span>Transcript</span>
              </header>
            )}
            {(isSummarizingTranscript
              ? new Array(7).fill({})
              : transcripts
            ).map((transcript, index) => (
              <TranscriptRow
                isLoading={isSummarizingTranscript}
                index={index}
                key={transcript.text}
                transcript={transcript}
                transcriptKey="summarizedTranscripts"
              />
            ))}
          </section>
        </main>
      </div>
    </>
  );
}

export default SummaryReview;
