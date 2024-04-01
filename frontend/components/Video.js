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

import {useEffect, useRef, useState} from 'react';
import 'video-react/dist/video-react.css'; // import css
import {BigPlayButton, Player} from 'video-react';
import VideoPlayerShimmer from './VideoPlayerShimmer';
import usePrevious from '../hooks/usePrevious';
import Button from './Button';
import styles from './Video.module.sass';

const defaultCopyLinkText = 'Copy Link';

function Video({name, isLoading, fullPath, source}) {
  const previousSource = usePrevious(source);
  const playerRef = useRef(null);
  const [copyLinkText, setCopyLinkText] = useState(defaultCopyLinkText);

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
    download(source, name);
  };

  const copyLink = () => {
    const encoded_path = encodeURIComponent(fullPath);
    const url = `${window.location.origin}/view/${encoded_path}`;
    navigator.clipboard.writeText(url);

    setCopyLinkText('Copied!');
    setTimeout(() => {
      setCopyLinkText(defaultCopyLinkText);
    }, 3000);
  };

  return (
    <div className={styles.videoContainer}>
      <Player ref={playerRef}>
        <BigPlayButton position="center" />
        <source src={source} />
      </Player>
      <div className={styles.buttonsContainer}>
        <Button onClick={downloadVideo} isSecondary>
          Download
        </Button>
        <Button onClick={copyLink} isSecondary>
          {copyLinkText}
        </Button>
      </div>
    </div>
  );
}

export default Video;
