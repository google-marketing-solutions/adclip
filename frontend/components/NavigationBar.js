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

import {useRouter} from 'next/router';
import styles from './NavigationBar.module.sass';
import clsx from 'clsx';

function Step({children, isActive, isDone, stepNumber}) {
  return (
    <div className={clsx(isActive && styles.active, isDone && styles.done)}>
      <span className={styles.stepNumber}>
        {isDone ? <>&#10004;</> : stepNumber}
      </span>
      <span>{children}</span>
    </div>
  );
}

function NavigationBar() {
  const router = useRouter();

  let currentStep = 0;
  switch (router.pathname) {
    case '/transcribeVideo/[videoFullPath]':
      currentStep = 1;
      break;
    case '/summaryReview/[videoFullPath]/[summarizeBy]':
      currentStep = 2;
      break;
    case '/outputVideos/[videoFullPath]':
      currentStep = 3;
      break;
    default:
      currentStep = 0;
      break;
  }
  if (currentStep === 0) return null;

  return (
    <nav className={styles.nav}>
      <Step isActive={currentStep >= 1} isDone={currentStep > 1} stepNumber="1">
        Review Transcript
      </Step>
      <div
        className={clsx(currentStep >= 2 && styles.active, styles.divider)}
      />
      <Step isActive={currentStep >= 2} isDone={currentStep > 2} stepNumber="2">
        Review Summarized Transcript
      </Step>
      <div
        className={clsx(currentStep >= 3 && styles.active, styles.divider)}
      />
      <Step isActive={currentStep >= 3} isDone={currentStep > 3} stepNumber="3">
        Output!
      </Step>
    </nav>
  );
}

export default NavigationBar;
