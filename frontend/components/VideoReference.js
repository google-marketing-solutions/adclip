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

import 'video-react/dist/video-react.css'; // import css
import {BigPlayButton, ControlBar, Player} from 'video-react';
import {forwardRef, useEffect} from 'react';
import Store from '../store/AdClipStore';
import usePrevious from '../hooks/usePrevious';
import VideoPlayerShimmer from './VideoPlayerShimmer';

const VideoReference = forwardRef(function VideoReference(
  {
    hasControls = true,
    isAutoplay = false,
    onTimeUpdateCallback = null,
    preload = undefined,
    transcripts = [],
  },
  playerRef,
) {
  const store = Store.useStore();
  const source = store.get('inputVideoURL');
  const previousSource = usePrevious(source);

  const timestamps = transcripts.map((transcript) => ({
    startTime: transcript.startTime,
    endTime: transcript.endTime,
  }));
  timestamps.sort((a, b) => a.startTime - b.startTime);

  useEffect(() => {
    if (previousSource !== source && playerRef.current != null) {
      playerRef.current.load();
    }
  }, [playerRef, previousSource, source]);

  const onTimeUpdate = (event) => {
    const {currentTime} = event.target;
    if (onTimeUpdateCallback != null) onTimeUpdateCallback(currentTime);

    if (transcripts != null && transcripts.length > 0) {
      let shouldPause = true;
      for (const {startTime, endTime} of timestamps) {
        if (currentTime < startTime) {
          playerRef.current.seek(startTime);
          shouldPause = false;
          break;
        }
        if (currentTime >= startTime && currentTime < endTime) {
          shouldPause = false;
          break;
        }
      }
      if (shouldPause) playerRef.current.pause();
    }
    const clipEndTime = store.get('clipEndTime');
    if (clipEndTime != null && currentTime >= clipEndTime) {
      playerRef.current.pause();
      store.set('clipEndTime')(null);
    }
  };

  return (
    <div style={{border: '1px solid black'}}>
      {source == null ? (
        <VideoPlayerShimmer />
      ) : (
        <Player
          autoPlay={isAutoplay}
          onTimeUpdate={onTimeUpdate}
          preload={preload}
          ref={playerRef}>
          <BigPlayButton position="center" />
          <ControlBar disableCompletely={!hasControls} />
          <source src={source} />
        </Player>
      )}
    </div>
  );
});

export default VideoReference;
