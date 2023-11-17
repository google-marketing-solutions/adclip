import 'video-react/dist/video-react.css'; // import css
import {BigPlayButton, ControlBar, Player} from 'video-react';
import {forwardRef, useEffect} from 'react';
import Store from '../store/AdClipStore';
import usePrevious from '../hooks/usePrevious';
import VideoPlayerShimmer from './VideoPlayerShimmer';

const VideoReference = forwardRef(function VideoReference(
  {hasControls = true, isAutoplay = false, transcripts = []},
  playerRef,
) {
  const store = Store.useStore();
  const isGettingOriginalVideoUrl = store.get('isGettingOriginalVideoUrl');
  const source = store.get('reviewVideo');
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
  };

  return (
    <div style={{border: '1px solid black'}}>
      {isGettingOriginalVideoUrl ? (
        <VideoPlayerShimmer />
      ) : (
        <Player
          autoPlay={isAutoplay}
          onTimeUpdate={onTimeUpdate}
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
