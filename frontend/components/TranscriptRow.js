import {useState} from 'react';
import {useDebouncedCallback} from 'use-debounce';
import Store from '../store/AdClipStore';
import styles from './TranscriptRow.module.sass';
import Input from './Input';
import clsx from 'clsx';

function TranscriptText({index, isHighlighted = false, transcript}) {
  const store = Store.useStore();
  const [content, setContent] = useState(transcript);
  const isTranscriptInEdit = store.get('isTranscriptInEdit');

  const debouncedUpdateTranscripts = useDebouncedCallback((value) => {
    const transcripts = store.get('reviewTranscripts');
    transcripts[index].text = value;
    store.set('reviewTranscripts')(transcripts);
  }, 1000);
  const changeValue = (event) => {
    setContent(event.target.value);
    debouncedUpdateTranscripts(event.target.value);
  };

  return isTranscriptInEdit ? (
    <input onChange={changeValue} type="text" value={content} />
  ) : (
    <span className={clsx(isHighlighted && styles.highlighted)}>{content}</span>
  );
}

function TimestampButton({index, objectKey, playerRef, transcriptKey}) {
  const store = Store.useStore();
  const areTimestampsInEdit = store.get('areTimestampsInEdit');
  const transcripts = store.get(transcriptKey);
  const time = transcripts[index][objectKey];

  const onChange = (value) => {
    transcripts[index][objectKey] = Number(value);
    transcripts[index].duration =
      transcripts[index].endTime - transcripts[index].startTime;
    store.set('summarizedTranscripts')(transcripts);
  };
  if (areTimestampsInEdit) {
    return (
      <Input
        onChange={onChange}
        onEnter={() => {
          store.set('areTimestampsInEdit')(false);
        }}
        type="number"
        value={time}
      />
    );
  }

  const changePlayerTime = () => {
    playerRef.current.seek(time);
  };

  return <button onClick={changePlayerTime}>{time}</button>;
}

function TranscriptRow({
  index,
  isHighlighted = false,
  isLoading,
  playerRef,
  transcriptKey,
  transcript,
}) {
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
        playerRef={playerRef}
        transcriptKey={transcriptKey}
      />
      <TimestampButton
        index={index}
        objectKey="endTime"
        playerRef={playerRef}
        transcriptKey={transcriptKey}
      />
      <TranscriptText
        index={index}
        isHighlighted={isHighlighted}
        transcript={transcript.text}
      />
    </div>
  );
}

export default TranscriptRow;
