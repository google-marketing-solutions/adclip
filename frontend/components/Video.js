import {useEffect, useRef} from 'react';
import 'video-react/dist/video-react.css'; // import css
import {BigPlayButton, Player} from 'video-react';
import VideoPlayerShimmer from './VideoPlayerShimmer';
import usePrevious from '../hooks/usePrevious';
import Button from './Button';

function Video({name, isLoading, source}) {
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

  const download = async (url, filename) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadVideo = () => {
    const filePathArr = fullPath.split('/');
    const fileName = filePathArr[filePathArr.length - 1];
    download(source, filename);
  };

  return (
    <div style={{border: '1px solid black'}}>
      <Player ref={playerRef}>
        <BigPlayButton position="center" />
        <source src={source} />
      </Player>
      <div style={{padding: '1rem'}}>
        <Button onClick={downloadVideo} isSecondary>
          Download
        </Button>
      </div>
    </div>
  );
}

export default Video;
