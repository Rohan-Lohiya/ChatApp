'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Socket } from 'socket.io-client';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  


  return (
    <div className={styles.homeContainer}>
      <div className={styles.card} onClick={() => router.push('/chat')}>
        <h1 className={styles.title}>💬 Enter Chat App</h1>
        <p className={styles.description}>Connect and chat with friends instantly.</p>
      </div>
    </div>
  );
}
