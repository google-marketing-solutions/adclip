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

import styles from './Header.module.sass';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import AdClipLogo from '../public/adclip.png';

function Header() {
  const logo = (
    <Image className={styles.logo} alt="AdClip logo" src={AdClipLogo} />
  );

  return (
    <header className={styles.header}>
      <Link href="/" className={clsx(styles.link, styles.logoButton)}>
        {logo}
        <span className={styles.brand}>AdClip</span>
      </Link>
    </header>
  );
}

export default Header;
