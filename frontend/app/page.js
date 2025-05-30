'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import Navbar from '@/components/homepage/Navbar';
import Aboutsection from '@/components/homepage/Aboutsection';
import Auther from '@/components/homepage/Auther';
import { Footer } from '@/components/homepage/Footer';
import Image from 'next/image';
import BlurText from '@/components/Animatedcomps/BlurText/BlurText';
import Particles from '@/components/Animatedcomps/Particles/Particles';
import { useTheme } from 'next-themes';

export default function Home() {
  const [showword, setshowword] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const [color, setcolor] = useState('ffffff');
  const [showParticles, setShowParticles] = useState(true);

  const router = useRouter();

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const autherRef = useRef(null);

  const handleAnimationComplete = () => {
    console.log(theme);
    setshowword(true);
    console.log('Animation completed!');
  };

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (theme === 'dark') {
      setcolor('#ffffff');
    } else if (theme === 'light') {
      setcolor('#000000');
    }
  }, [theme]);
  useEffect(() => {
    if (!mounted) return;

    setShowParticles(false);
    const timeout = setTimeout(() => {
      setShowParticles(true);
    }, 50); // short delay to force re-mount

    return () => clearTimeout(timeout);
  }, [theme]);

  return (
    <div className={styles.homeContainer} id="homecont">
      <div className={styles.navcont}>
        <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>
      <div className={styles.particlescont}>
        {mounted && showParticles && (
          <Particles
            key={theme}
            particleColors={['#3ac4ff', color]}
            particleCount={300}
            particleSpread={20}
            speed={0.05}
            particleBaseSize={140}
            moveParticlesOnHover={false}
            alphaParticles={false}
            disableRotation={false}
          />
        )}
      </div>
      <div ref={homeRef} className={styles.getstartcont} id="home">
        <div className={styles.getstarttextcont}>
          <h2>
            <BlurText
              text="Connect, Chat,"
              delay={400}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className={styles.blurtext}
            />
          </h2>
          <h2 className={styles.fontheadingcolor}>
            {showword && (
              <BlurText
                text="Thrive"
                delay={400}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
                className={styles.blurtext}
              />
            )}
          </h2>
          <div className={styles.getstartpara}>
            ChatBox is your all-in-one platform for seamless communication. Experience crystal-clear chats, robust
            features, and an intuitive interface designed for modern teams and communities.
          </div>
          <button onClick={() => router.push('/chat')} className={styles.animatedButton}>
            <svg viewBox="0 0 24 24" className={styles.arr2} xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
            <span className={styles.text}>Get started</span>
            <span className={styles.circle}></span>
            <svg viewBox="0 0 24 24" className={styles.arr1} xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
          </button>
        </div>
        <div className={styles.chatimgcont}>
          {mounted && (
            <Image
              className={styles.chatimg}
              src={theme === 'dark' ? '/chatappimg.png' : '/chatappimglight.png'}
              width={1712}
              height={831}
              alt="ChatApp"></Image>
          )}
        </div>
      </div>

      <div id="about">
        <Aboutsection />
      </div>
      <div id="auther">
        <Auther />
      </div>
      <Footer />
    </div>
  );
}
