import styles from './VideoPlayerShimmer.module.sass';
import clsx from 'classnames';

function VideoPlayerShimmer({isVertical = false}) {
  return (
    <div className={clsx(styles.card, isVertical && styles.vertical)}>
      <div className={styles.wrapper}>
        <div className={styles.playButtonContainer}>
          <div className={clsx(styles.playButton, styles.animate)} />
        </div>
        <div className={clsx(styles.controls, styles.animate)} />
      </div>
    </div>
  );
}

export default VideoPlayerShimmer;
