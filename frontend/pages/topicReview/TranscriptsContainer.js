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

import Store from '../../store/AdClipStore';
import styles from './TranscriptsContainer.module.sass';
import Button from '../../components/Button';
import clsx from 'clsx';
import TranscriptRow from '../../components/TranscriptRow';

function TimestampButton({playerRef, time}) {
  const changePlayerTime = () => {
    playerRef.current.seek(time);
  };
  return <button onClick={changePlayerTime}>{time}</button>;
}

function TranscriptsContainer({playerRef}) {
  const store = Store.useStore();
  const transcriptWithTopics = store.get('transcriptWithTopics');
  const isTranscribingVideo = store.get('isTranscribingVideo');
  const setTranscriptWithTopics = store.set('transcriptWithTopics');

  const toggle = (topic, lineNumber) => {
    transcriptWithTopics[topic][lineNumber].checked =
      !transcriptWithTopics[topic][lineNumber].checked;
    setTranscriptWithTopics(transcriptWithTopics);
  };
  const toggleTopic = (topic, checked) => {
    Object.keys(transcriptWithTopics[topic]).forEach((lineNumber) => {
      transcriptWithTopics[topic][lineNumber].checked = checked;
    });
    setTranscriptWithTopics(transcriptWithTopics);
  };

  return (
    <div className={styles.transcriptsContainer}>
      {isTranscribingVideo && (
        <p className="loadingEllipsis">The topics are being extracted</p>
      )}
      <div className={clsx(styles.transcriptBody, styles.withTopic)}>
        {isTranscribingVideo &&
          new Array(8)
            .fill({})
            .map((transcript, index) => (
              <TranscriptRow
                canKeepTranscripts
                isInteractive
                isLoading={isTranscribingVideo}
                index={index}
                playerRef={playerRef}
                key={transcript.text}
                transcript={transcript}
                transcriptKey="reviewTranscripts"
              />
            ))}
        {!isTranscribingVideo &&
          Object.keys(transcriptWithTopics).map((topic) => (
            <>
              <div className={styles.transcriptTopic}>
                <input
                  checked={Object.values(transcriptWithTopics[topic]).every(
                    (line) => line.checked === true,
                  )}
                  className={styles.checkbox}
                  onChange={(e) => toggleTopic(topic, e.target.checked)}
                  type="checkbox"
                />
                Topic: {topic}
              </div>
              {Object.entries(transcriptWithTopics[topic]).map(
                ([lineNumber, {checked, startTime, endTime, text}]) => (
                  <div className={clsx(styles.transcriptRow, styles.withTopic)}>
                    <input
                      defaultChecked={true}
                      className={styles.checkbox}
                      checked={checked}
                      onChange={() => toggle(topic, lineNumber)}
                      type="checkbox"
                    />
                    <TimestampButton playerRef={playerRef} time={startTime} />
                    <TimestampButton playerRef={playerRef} time={endTime} />
                    <span
                      className={clsx(
                        styles.transcriptText,
                        checked && styles.highlighted,
                      )}>
                      {text}
                    </span>
                  </div>
                ),
              )}
            </>
          ))}
      </div>
    </div>
  );
}

export default TranscriptsContainer;
