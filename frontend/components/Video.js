import {useEffect, useRef} from 'react';
import 'video-react/dist/video-react.css'; // import css
import {BigPlayButton, Player} from 'video-react';
import VideoPlayerShimmer from './VideoPlayerShimmer';
import usePrevious from '../hooks/usePrevious';

function Video({isLoading, source}) {
  const previousSource = usePrevious(source);
  const playerRef = useRef(null);

  useEffect(() => {
    if (previousSource !== source && playerRef && playerRef.current) {
      playerRef.current.load();
    }
  }, [playerRef, previousSource, source]);

  if (isLoading) {
    return <VideoPlayerShimmer isVertical />;
  }

  return (
    <div style={{border: '1px solid black'}}>
      <Player ref={playerRef}>
        <BigPlayButton position="center" />
        <source src={source} />
      </Player>
    </div>
  );
}

export default Video;
