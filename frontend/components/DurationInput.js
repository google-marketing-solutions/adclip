import 'rc-slider/assets/index.css';
import styles from './DurationInput.module.sass';
import Store from '../store/AdClipStore';
import Input from './Input';
import Button from './Button';
import Slider from 'rc-slider';

const DEFAULT_MAX_DURATION = 40;
const DEFAULT_MIN_DURATION = 20;
const MIN_DURATION = 10;
const MIN_DURATION_GAP = 10;
const SLIDER_STEP = 5;

function DurationInput({disabled, onSubmit, submitText}) {
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
    <div>
      <div className={styles.summarizeActionInputs}>
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
      <Button disabled={disabled} onClick={onSubmit}>
        {submitText}
      </Button>
    </div>
  );
}

export default DurationInput;
