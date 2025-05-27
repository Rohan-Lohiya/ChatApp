import React from "react";
import styles from "./settings.module.css";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { setwebTheme, setenterissend } from "@/app/store/selectedUserSlice";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";

const Settings = () => {
  const profilename = useSelector((state) => state.selectedUser.myname);
  const entersend = useSelector((state) => state.selectedUser.enterissend);
  const [chatsettingpressed, setchatsettingpressed] = useState(false);
  const [themebuttonpressed, setthemebuttonpressed] = useState(false);
  const [wallpaperpressed, setwallpaperpressed] = useState(false);
  const [selected, setSelected] = useState(0);
  const themeref = useRef(null);
  const dispatch = useDispatch();
  const { theme, setTheme } = useTheme(); // Using next-themes for theme management
  const { data: session } = useSession(); // Get session data from next-auth

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeref.current && !themeref.current.contains(event.target)) {
        setthemebuttonpressed(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChatSettingClick = () => {
    setchatsettingpressed(!chatsettingpressed);
  };
  const handleselecttheme = (e) => {
    dispatch(setwebTheme(e));
    setTheme(e); // Set the theme using next-themes
    setthemebuttonpressed(false);
    console.log(e);
  };
  const handlewallpaperclick = () => {
    // Handle wallpaper click here
    setwallpaperpressed(!wallpaperpressed);
    console.log("Wallpaper clicked");
  };
  const handlewallpaperchange = (index) => {
    console.log("Wallpaper changed to index:", index);
  };
  const handleCheckboxChange = (e) => {
    dispatch(setenterissend(e.target.checked));
  };

  const COLORS = [
    { name: "Default", color: "#ece8e0" }, // Default
    { color: "#c7eae5" },
    { color: "#b7ded3" },
    { color: "#7fcdbb" },
    { color: "#c3d7e4" },
    { color: "#7ddce1" },
    { color: "#5ac6d0" },
    { color: "#d1d1ea" },
    { color: "#c2c6c7" },
    { color: "#cfdac0" },
    { color: "#e3e6aa" },
    { color: "#f9f6a6" },
    { color: "#ffd89e" },
    { color: "#ffb6b6" },
    { color: "#ff6f7d" },
    { color: "#ff4e6b" },
    { color: "#a51d40" },
    { color: "#d16a3e" },
    { color: "#655153" },
    { color: "#4b7b7b" },
    { color: "#2296c7" },
    { color: "#2b4d7c" },
    { color: "#4d5e65" },
    { color: "#23292c" },
  ];

  return (
    <div className={styles.settingscontainer}>
      {/* Chat Settings Panel (always in DOM for animation) */}
      <div
        className={`${styles.chatsetting} ${
          chatsettingpressed ? styles.chatsettingpressed : ""
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks on the panel from closing it
      >
        <div className={styles.flexcentercenter}>
          <span>
            <Image
              onClick={() => setchatsettingpressed(false)}
              className={styles.back}
              src={"/backarrow.png"}
              height={40}
              width={40}
              alt="back"
            ></Image>
          </span>
          <span>Chat</span>
        </div>
        <div className={styles.displayheading}>Display</div>
        <div
          ref={themeref}
          className={styles.chatsettingcontent}
          onClick={() => setthemebuttonpressed(!themebuttonpressed)}
        >
          <span>Theme</span>
          <span>
            <Image
              className={styles.arrow}
              src={"/arrow.png"}
              height={60}
              width={60}
              alt="arrow"
            />
          </span>
          {themebuttonpressed && (
            <span className={styles.themebuttonoptions}>
              <div
                onClick={(e) => {
                  e.stopPropagation(); // prevents dropdown from closing
                  handleselecttheme("light");
                }}
                className={styles.themeindioption}
              >
                Light
              </div>
              <hr />
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleselecttheme("dark");
                }}
                className={styles.themeindioption}
              >
                Dark
              </div>
            </span>
          )}
        </div>
        <hr className={styles.hrcss} />

        <div
          onClick={handlewallpaperclick}
          className={styles.chatsettingcontent}
        >
          <span>Wallpaper</span>
          <span>
            <Image
              className={styles.arrow}
              src={"/arrow.png"}
              height={60}
              width={60}
              alt="arrow"
            ></Image>
          </span>
        </div>
        {wallpaperpressed && (
          <div className={styles.paletteGrid}>
            {COLORS.map((col, idx) => (
              <button
                key={idx}
                className={`${styles.colorBox} ${
                  selected === idx ? styles.selected : ""
                }`}
                style={{
                  background: col.color,
                  color: col.name ? "#333" : "transparent",
                }}
                onClick={() => handlewallpaperchange(idx)}
              >
                {col.name || ""}
              </button>
            ))}
          </div>
        )}
        <hr className={styles.linebreak} />
        <div className={styles.displayheading}>Chat settings</div>
        <div className={styles.chatsettingcontent}>
          <span>Enter is send</span>
          <span className={styles.checkboxcont}><input className={styles["ui-checkbox"]} type="checkbox"  checked={entersend} onChange={handleCheckboxChange}/></span>
        </div>
      </div>

      {/* Settings Content */}
      <div className={styles.settingscontent}>
        <div className={`${styles.settingsheader} ${styles.hover}`}>
          <span>
            <Image
              src={session.user.image || "/google.png"}
              height={60}
              width={60}
              alt="Profile avatar"
              onError={(e) => {
                e.currentTarget.src = "/default-avatar.png"; // Fallback if image fails to load
              }}
            />
          </span>
          <span>{profilename}</span>
        </div>

        <div
          className={`${styles.chatsettingcont} ${styles.hover}`}
          onClick={handleChatSettingClick}
        >
          <span>
            <Image src={"/chatselect.png"} height={40} width={40} alt="Chat" />
          </span>
          <span>Chats</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
