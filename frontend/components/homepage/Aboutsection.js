import React from 'react';
import styles from './aboutsection.module.css';
import Image from 'next/image';
import { MessageCircle, Users, ThumbsUp, Zap } from 'lucide-react';

const Aboutsection = () => {
  return (
    <div className={styles.aboutsection}>
      <div className={styles.aboutheadingcont}>
        <div className={styles.aboutheading}>
          <span className={styles.aboutheading1}>{'Discover our '}</span>
          <span className={styles.aboutheading2}>Features</span>
        </div>
        <div className={styles.aboutheadingtext}>
          ChatBox is packed with powerful features to enhance your communication experience.
        </div>
      </div>
      <div className={styles.cardcomp}>
        <div className={styles.card}>
          <MessageCircle className={styles.icon} />
          <h3>Real-time Messaging</h3>
          <div className={styles.cardtext}>
            Instantly connect with individuals or groups through our blazing-fast messaging service.
          </div>
        </div>
        <div className={styles.card}>
          <Users className={styles.icon} />
          <h3>Group Chats</h3>
          <div className={styles.cardtext}>
            Create and manage group conversations for teams, projects, or communities with ease.
          </div>
        </div>
        <div className={styles.card}>
          <ThumbsUp className={styles.icon} />
          <h3>User-Friendly Interface</h3>
          <div className={styles.cardtext}>
            Enjoy a clean, intuitive design that makes chatting simple and enjoyable for everyone.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aboutsection;
