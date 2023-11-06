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
