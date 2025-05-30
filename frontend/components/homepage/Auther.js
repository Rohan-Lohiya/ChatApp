import React from 'react';
import styles from './auther.module.css';
import TiltedCard from '../Animatedcomps/TiltedCard/TiltedCard';
import Dock from '../Animatedcomps/Dock/Dock';
import { Home, Archive, User, Settings } from 'lucide-react';
import { FaLinkedinIn, FaGithub, FaInstagram } from 'react-icons/fa';

const Auther = () => {
  const items = [
    {
      icon: <FaLinkedinIn size={18} className={styles.icons} />,
      label: 'LinkedIn',
      onClick: () => window.open('https://www.linkedin.com/in/rohan-lohiya-b16518172/', '_blank'),
    },
    {
      icon: <FaGithub size={18} className={styles.icons} />,
      label: 'GitHub',
      onClick: () => window.open('https://github.com/Rohan-Lohiya', '_blank'),
    },
    {
      icon: <FaInstagram size={18} className={styles.icons} />,
      label: 'Instagram',
      onClick: () => window.open('https://www.instagram.com/rohanlohiya18/', '_blank'),
    },
  ];

  return (
    <div className={styles.maincont}>
      <div className={styles.textcont}>
        <h2>Auther</h2>
        <h2 className={styles.headingcolorfont}>Rohan Lohiya</h2>
        <h3>IIIT-Guwahati</h3>
        <div className={styles.dockcont}>
          <Dock items={items} panelHeight={60} baseItemSize={50} magnification={70} />
        </div>
      </div>
      <div className={styles.imagecont}>
        <TiltedCard
          imageSrc="/auther.png"
          altText="Rohan Lohiya"
          captionText=""
          containerHeight="300px"
          containerWidth="300px"
          imageHeight="250px"
          imageWidth="250px"
          rotateAmplitude={12}
          scaleOnHover={1.1}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={true}
          overlayContent={<p className="tilted-card-demo-text">Rohan Lohiya</p>}
        />
      </div>
    </div>
  );
};

export default Auther;
