import React from 'react';
import styles from './navbar.module.css';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
import { Link } from 'react-scroll';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Navbar = ({ activeSection, setActiveSection }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const handleAuth = () => {
    return session !== null ? signOut() : router.push('/login');
  };

  return (
    <div className={styles.maincont}>
      <div className={styles.homelogocont}>
        <Image src={'/chatlogo.png'} height={30} width={30} alt="Home"></Image>
        <h3>ChatBox</h3>
      </div>
      <div className={styles.navoptioncont}>
        <div className={styles.navigationcont}>
          <div className={activeSection === 'home' ? styles.active : ''}>
            <Link
              containerId="homecont"
              activeClass="active"
              to="home"
              spy={true}
              smooth={true}
              offset={-200}
              duration={500}
              onSetActive={() => setActiveSection('home')}>
              Get Start
            </Link>
          </div>
          <div className={activeSection === 'about' ? styles.active : ''}>
            <Link
              containerId="homecont"
              activeClass="active"
              to="about"
              spy={true}
              smooth={true}
              offset={-200}
              duration={500}
              onSetActive={() => setActiveSection('about')}>
              About
            </Link>
          </div>
          <div className={activeSection === 'auther' ? styles.active : ''}>
            <Link
              containerId="homecont"
              activeClass="active"
              to="auther"
              spy={true}
              smooth={true}
              offset={-200}
              duration={500}
              onSetActive={() => setActiveSection('auther')}>
              Auther
            </Link>
          </div>
        </div>
        <ThemeToggle />
        <button onClick={handleAuth} className={styles.signbtn}>
          {session !== null ? 'SignOut' : 'SignIn'}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
