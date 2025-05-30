import { MessageSquareText } from 'lucide-react';
import styles from './footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <MessageSquareText className={styles.icon} />
          <p className={styles.brandName}>ChatBox</p>
        </div>
        <p className={styles.copyright}>&copy; {new Date().getFullYear()} ChatBox. All rights reserved.</p>
        <p className={styles.tagline}>Modern communication, simplified.</p>
      </div>
    </footer>
  );
}
