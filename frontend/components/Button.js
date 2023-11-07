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
