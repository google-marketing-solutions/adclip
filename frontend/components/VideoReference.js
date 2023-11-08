import 'video-react/dist/video-react.css'; // import css
import {BigPlayButton, Player} from 'video-react';
import {useEffect, useRef} from 'react';
import Store from '../store/AdClipStore';
import usePrevious from '../hooks/usePrevious';
import VideoPlayerShimmer from './VideoPlayerShimmer';

function VideoReference(props) {
  const store = Store.useStore();
  const isGettingOriginalVideoUrl = store.get('isGettingOriginalVideoUrl');
  const source = store.get('reviewVideo');
  const previousSource = usePrevious(source);
  const playerRef = useRef();

  useEffect(() => {
    if (previousSource !== source && playerRef.current != null) {
      playerRef.current.load();
    }
  }, [playerRef, previousSource, source]);

  return (
    <div style={{border: '1px solid black'}}>
      {isGettingOriginalVideoUrl ? (
        <VideoPlayerShimmer />
      ) : (
        <Player ref={playerRef}>
          <BigPlayButton position="center" />
          <source src={source} />
        </Player>
      )}
    </div>
  );
}

export default VideoReference;