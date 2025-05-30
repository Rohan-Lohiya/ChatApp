'use client';
import React from 'react';
import styles from './login.module.css';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';

const Page = () => {
  const { data: session } = useSession();
  const [fakesession, setfakesession] = useState(true);
  const dispatch = useDispatch();

  const handleGoogleLogin = e => {
    console.log('Login btn pressed');
    signIn('google');
  };

  if (session) {
    //For now use Fakesession while making frontend UI, change to session when make backend
    return (
      <div className={styles.container}>
        <div className={styles.signoutcontainer}>
          <h2 className={styles.welcome}>Welcome, {session.user.name}</h2>
          {
            <Image
              src={session.user.image}
              height={200}
              width={200}
              alt="Profile"
              className={styles.profilePic}></Image>
          }
          <button className={styles.signoutbutton} onClick={() => signOut()}>
            Sign out
          </button>
          <Link href={`/`} className={styles.homepagebutton}>
            Home Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.googleLoginbtn} onClick={handleGoogleLogin}>
        <span>
          <Image src={'/google.png'} width={50} height={50} alt="Google"></Image>
        </span>
        <span>Login With Google</span>
      </div>
    </div>
  );
};

export default Page;
