import Store from '../store/AdClipStore';
import styles from './TranscriptRow.module.sass';
import clsx from 'clsx';

function TranscriptText({transcript}) {
  return <span className={styles.transcriptText}>{transcript}</span>;
}

function TimestampButton({index, objectKey, transcriptKey}) {
  const store = Store.useStore();
  const transcripts = store.get(transcriptKey);
  const time = transcripts[index][objectKey];

  return <button>{time}</button>;
}

function TranscriptRow({index, isLoading, transcriptKey, transcript}) {
  if (isLoading) {
    return (
      <div className={clsx(styles.wrapper, styles.transcriptRow)}>
        <div className={clsx(styles.textShimmer, styles.animate)} />
        <div className={clsx(styles.textShimmer, styles.animate)} />
        <div className={clsx(styles.textShimmer, styles.animate)} />
      </div>
    );
  }

  return (
    <div className={styles.transcriptRow}>
      <TimestampButton
        index={index}
        objectKey="startTime"
        transcriptKey={transcriptKey}
      />
      <TimestampButton
        index={index}
        objectKey="endTime"
        transcriptKey={transcriptKey}
      />
      <TranscriptText transcript={transcript.text} />
    </div>
  );
}

export default TranscriptRow;
