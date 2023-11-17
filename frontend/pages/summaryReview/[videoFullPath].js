import {useRef, useState} from 'react';
import styles from './index.module.sass';
import Store from '../../store/AdClipStore';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';
import clsx from 'clsx';
import TranscriptRow from '../../components/TranscriptRow';
import VideoReference from '../../components/VideoReference';
import Button from '../../components/Button';
import DurationInput from '../../components/DurationInput';

function SummaryReview() {
  const store = Store.useStore();
  const areTimestampsInEdit = store.get('areTimestampsInEdit');
  const isSummarizingTranscript = store.get('isSummarizingTranscript');
  const transcripts = store.get('summarizedTranscripts');
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(-1);
  const playerRef = useRef(null);

  const filename = getFilenameFromFullPath(videoFullPath);

  const totalDuration = transcripts.reduce(
    (duration, transcript) =>
      duration + transcript.endTime - transcript.startTime,
    0,
  );

  const generateVideos = () => {
    router.push('/outputVideos/' + encodeURIComponent(videoFullPath));
  };

  const onPreviewTimeUpdate = (currentTime) => {
    setPreviewCurrentTime(currentTime);
  };

  const resummarize = () => {
    store.set('isSummarizingTranscript')(true);
  };

  const togglePreview = () => {
    if (isPreviewing) setPreviewCurrentTime(-1);
    else store.set('areTimestampsInEdit')(false);
    setIsPreviewing(!isPreviewing);
  };

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
              <>
                <div className={styles.editButtons}>
                  {!isPreviewing && (
                    <Button
                      isSecondary
                      disabled={isSummarizingTranscript}
                      onClick={() => {
                        store.set('areTimestampsInEdit')(!areTimestampsInEdit);
                      }}>
                      {!areTimestampsInEdit ? 'Adjust Timestamps' : 'Save'}
                    </Button>
                  )}
                  <Button
                    isSecondary
                    disabled={isSummarizingTranscript}
                    onClick={togglePreview}>
                    {isPreviewing ? 'Stop Preview' : 'Preview'}
                  </Button>
                </div>
                <header className={clsx(styles.header, styles.transcriptRow)}>
                  <span>Start</span>
                  <span>End</span>
                  <span>Transcript</span>
                </header>
              </>
            )}
            {(isSummarizingTranscript
              ? new Array(7).fill({})
              : transcripts
            ).map((transcript, index) => (
              <TranscriptRow
                isHighlighted={
                  transcript.startTime <= previewCurrentTime &&
                  transcript.endTime > previewCurrentTime
                }
                isLoading={isSummarizingTranscript}
                index={index}
                key={transcript.text}
                playerRef={playerRef}
                transcript={transcript}
                transcriptKey="summarizedTranscripts"
              />
            ))}
          </section>
          <section>
            <p>Video Reference</p>
            {isPreviewing ? (
              <div>
                {/* added a div to force rerendering of Player */}
                <VideoReference
                  hasControls={false}
                  isAutoplay
                  onTimeUpdateCallback={onPreviewTimeUpdate}
                  ref={playerRef}
                  transcripts={transcripts}
                />
              </div>
            ) : (
              <VideoReference ref={playerRef} />
            )}
          </section>
        </main>
        <div className={styles.buttonSectionsContainer}>
          <section>
            <p>Looks good?</p>
            <Button onClick={generateVideos} disabled={isSummarizingTranscript}>
              Generate Video
            </Button>
          </section>
          <div className={styles.divider} />
          <section>
            <DurationInput
              disabled={isSummarizingTranscript}
              onSubmit={resummarize}
              submitText="Resummarize"
              isSecondary
              isCompact
            />
          </section>
        </div>
      </div>
    </>
  );
}

export default SummaryReview;
