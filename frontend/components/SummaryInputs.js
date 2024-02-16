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

import styles from './SummaryInputs.module.sass';
import Store from '../store/AdClipStore';
import Button from './Button';
import DurationInput from './DurationInput';
import clsx from 'clsx';

const textModels = ['text-unicorn@001', 'text-bison@001', 'text-bison@002'];

function SummaryInputs({
  disabled,
  isCompact = false,
  isSecondary = false,
  onSubmit,
  submitText,
}) {
  const store = Store.useStore();
  const summaryMethod = store.get('summaryMethod');
  const textModel = store.get('textModel');
  const setTextModel = store.set('textModel');
  const selectRadioButton = (e) => {
    store.set('summaryMethod')(e.currentTarget.value);
  };

  const textModelsSelection = (
    <div className={styles.textModelsContainer}>
      <label for="text_models">Text Model:</label>
      <select
        id="text_models"
        onChange={(e) => setTextModel(e.target.value)}
        defaultValue={textModel}
        value={textModel}>
        {textModels.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={clsx(isCompact && styles.summarizeActionContainer)}>
      <div className={styles.summarizeMethodsContainer}>
        Summary Method:
        <span>
          <input
            id="duration_summary"
            type="radio"
            name="summary_method"
            value="duration"
            checked={summaryMethod === 'duration'}
            onChange={selectRadioButton}
          />
          <label for="duration_summary">Duration</label>
        </span>
        <span>
          <input
            id="topic_summary"
            type="radio"
            name="summary_method"
            value="topic"
            checked={summaryMethod === 'topic'}
            onChange={selectRadioButton}
          />
          <label for="topic_summary">Topic</label>
        </span>
      </div>
      {summaryMethod === 'duration' && <DurationInput isCompact={isCompact} />}
      {textModelsSelection}
      <Button disabled={disabled} isSecondary={isSecondary} onClick={onSubmit}>
        {submitText}
      </Button>
    </div>
  );
}

export default SummaryInputs;
