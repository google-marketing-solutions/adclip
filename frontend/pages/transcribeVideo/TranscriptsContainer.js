import Store from '../../store/AdClipStore';
import styles from './TranscriptsContainer.module.sass';
import Button from '../../components/Button';
import clsx from 'clsx';
import TranscriptRow from '../../components/TranscriptRow';

function TranscriptsContainer({playerRef}) {
  const store = Store.useStore();
  const transcripts = store.get('reviewTranscripts');
  const isTranscribingVideo = store.get('isTranscribingVideo');
  const isTranscriptInEdit = store.get('isTranscriptInEdit');

  return (
    <div className={styles.transcriptsContainer}>
      {isTranscribingVideo ? (
        <p className="loadingEllipsis">The video is being transcribed</p>
      ) : (
        <>
          <div className={styles.editButtons}>
            <Button
              isSecondary
              disabled={isTranscribingVideo}
              onClick={() => {
                store.set('isTranscriptInEdit')(!isTranscriptInEdit);
              }}>
              {!isTranscriptInEdit ? 'Edit Transcript Text' : 'Save'}
            </Button>
          </div>
          <div className={clsx(styles.header, styles.transcriptRow)}>
            <span>Start</span>
            <span>End</span>
            <span>Transcript</span>
          </div>
        </>
      )}
      <div className={styles.transcriptBody}>
        {(isTranscribingVideo ? new Array(8).fill({}) : transcripts).map(
          (transcript, index) => (
            <TranscriptRow
              isLoading={isTranscribingVideo}
              index={index}
              key={transcript.text}
              playerRef={playerRef}
              transcript={transcript}
              transcriptKey="reviewTranscripts"
            />
          ),
        )}
      </div>
    </div>
  );
}

export default TranscriptsContainer;
