/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

function KeepTranscriptCheckbox({index, transcript, transcriptKey}) {
  const store = Store.useStore();

  const toggle = () => {
    const transcripts = store.get(transcriptKey);
    const newShouldKeepValue = transcripts[index].shouldKeep !== true;
    transcripts[index].shouldKeep = newShouldKeepValue;
    transcripts[index].words = transcripts[index].words.map((word) => ({
      ...word,
      shouldKeep: newShouldKeepValue,
    }));
    store.set(transcriptKey)(transcripts);
  };

  return (
    <input
      defaultChecked={transcript.shouldKeep}
      className={styles.checkbox}
      onChange={toggle}
      type="checkbox"
    />
  );
}

function TranscriptRow({
  canKeepTranscripts = false,
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
    <div
      className={clsx(
        styles.transcriptRow,
        canKeepTranscripts && styles.withCheckbox,
      )}>
      {canKeepTranscripts && (
        <KeepTranscriptCheckbox transcript={transcript.text} index={index}
        transcriptKey={transcriptKey} />
      )}
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
