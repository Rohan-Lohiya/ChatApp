// components/ThemeToggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './themetoggle.module.css';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button onClick={toggleTheme} className={styles.themeButton} aria-label="Toggle theme">
      <motion.div
        key={theme}
        initial={{ opacity: 0, rotate: -45 }}
        animate={{ opacity: 1, rotate: 0 }}
        exit={{ opacity: 0, rotate: 45 }}
        transition={{ duration: 0.2 }}
        className={styles.iconContainer}>
        {theme === 'light' ? <Moon className={styles.icon} /> : <Sun className={styles.icon} />}
      </motion.div>
    </button>
  );
}
