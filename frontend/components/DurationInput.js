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

import 'rc-slider/assets/index.css';
import styles from './DurationInput.module.sass';
import Store from '../store/AdClipStore';
import Input from './Input';
import Slider from 'rc-slider';
import clsx from 'clsx';

const DEFAULT_MAX_DURATION = 40;
const DEFAULT_MIN_DURATION = 20;
const MIN_DURATION = 10;
const MIN_DURATION_GAP = 10;
const SLIDER_STEP = 5;

/**
 * Component that allows user to input the expected minimum and maximum duration
 * for the output video.
 */
function DurationInput({isCompact = false}) {
  const store = Store.useStore();
  const minDuration = store.get('minDuration');
  const maxDuration = store.get('maxDuration');
  const setMinDuration = store.set('minDuration');
  const setMaxDuration = store.set('maxDuration');
  const onSliderChange = ([min, max]) => {
    setMinDuration(min);
    setMaxDuration(max);
  };

  return (
    <div className={clsx(isCompact && styles.compact, styles.container)}>
      <label>Output Duration (in seconds)</label>
      <Slider
        className={styles.slider}
        range
        allowCross={false}
        min={MIN_DURATION}
        defaultValue={[DEFAULT_MIN_DURATION, DEFAULT_MAX_DURATION]}
        step={SLIDER_STEP}
        draggableTrack
        value={[minDuration, maxDuration]}
        onChange={onSliderChange}
      />
      <div className={styles.durationTextInputs}>
        <label htmlFor="minDuration">Min</label>
        <Input
          id="minDuration"
          type="number"
          min="0"
          max={maxDuration - MIN_DURATION_GAP}
          placeholder="Min"
          onChange={setMinDuration}
          value={minDuration}
        />
        <label htmlFor="maxDuration">Max</label>
        <Input
          id="maxDuration"
          type="number"
          placeholder="Max"
          onChange={setMaxDuration}
          min={minDuration + MIN_DURATION_GAP}
          value={maxDuration}
        />
      </div>
    </div>
  );
}

export default DurationInput;
