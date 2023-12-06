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

import styles from './Button.module.sass';
import clsx from 'clsx';

export default function Button({
  children,
  isBlock = false,
  isSecondary = false,
  ...otherProps
}) {
  return (
    <button
      className={clsx(
        styles.button,
        isBlock && styles.block,
        isSecondary && styles.secondary,
      )}
      {...otherProps}>
      {children}
    </button>
  );
}
