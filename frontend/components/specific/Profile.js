import React from "react";
import styles from "./profile.module.css";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { useState, useRef } from "react";
import { setmyname, setabout } from "@/app/store/selectedUserSlice";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react"; // Import useSession from next-auth
import axios from "axios";

const Profile = () => {
  const profilename = useSelector((state) => state.selectedUser.myname);
  const profileabout = useSelector((state) => state.selectedUser.about);
  const webtheme = useSelector((state) => state.selectedUser.webtheme);
  const token = useSelector((state) => state.selectedUser.token);
  const [name, setname] = useState(profilename);
  const [allowedit, setallowedit] = useState(false);
  const [aboutinfo, setaboutinfo] = useState(profileabout);
  const [alloweditabout, setalloweditabout] = useState(false);
  const [aboutbtndisabled, setaboutbtndisabled] = useState(false);
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const inputRefabout = useRef(null);
  const { theme } = useTheme(); // Using next-themes for theme management
  const { data: session } = useSession(); // Get session data from next-auth
  
  const handlechangeS = (e) => {
    setname(e.target.value);
    dispatch(setmyname(e.target.value));
  };
  const handleaboutchangeS = (e) => {
    setaboutinfo(e.target.value);
    dispatch(setabout(e.target.value));
  }

  const handleEditClick = () => {
    setallowedit(!allowedit);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0); // Ensure focus after state update
    console.log(theme);
  };
  const handleAboutEditClick = async () => {
    if(aboutbtndisabled) return; // Prevent multiple clicks
    if (alloweditabout) {
      // Save the about info to the server
      setaboutbtndisabled(true); // Disable button to prevent multiple clicks
      try {
        const response = await axios.post(
          "http://localhost:5000/api/change-about",
          { about: aboutinfo },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("About info updated:", response.data);
      } catch (error) {
        console.error("Error updating about info:", error);
      }
    }
    setaboutbtndisabled(false); // Re-enable button after operation
    setalloweditabout(!alloweditabout);
    setTimeout(() => {
      inputRefabout.current?.focus();
    }, 0); // Ensure focus after state update
  }

  return (
    <div className={styles.profilecont}>
      <div className={styles.profilepiccont}>
        <div className={styles.profilepicinnercont}>
          <Image
            className={styles.profilepicimg}
            src={session.user.image}
            height={100}
            width={100}
            alt="profilepic"
          ></Image>

          <div className={styles.profilepiceditbtn}>
            <Image
              src={"/camera.png"}
              height={30}
              width={30}
              alt="rofilepic"
            ></Image>
          </div>
        </div>
      </div>
      <div className={styles.editname}>
        <div className={styles.editnameheadiing}>Your Name</div>
        <div className={styles.editnamecont}>
          <input
            ref={inputRef}
            className={styles.editnameinput}
            type="text"
            onChange={handlechangeS}
            value={name}
            readOnly={!allowedit}
            onFocus={(e) => {
              if (!allowedit) e.target.blur();
            }}
          />
          <Image
            onClick={handleEditClick}
            src={
              !allowedit
                ? `/edit${theme === "light" ? "" : "light"}.png`
                : `/check${theme === "light" ? "" : "light"}.png`
            }
            height={20}
            width={20}
            alt="edit"
          ></Image>
        </div>
      </div>
      <div className={styles.editname}>
        <div className={styles.editnameheadiing}>About</div>
        <div className={styles.editnamecont}>
          <input
            ref={inputRefabout}
            className={styles.editnameinput}
            type="text"
            onChange={handleaboutchangeS}
            value={aboutinfo}
            readOnly={!alloweditabout}
            onFocus={(e) => {
              if (!alloweditabout) e.target.blur();
            }}
          />
          <Image
            onClick={handleAboutEditClick}
            src={
              !alloweditabout
                ? `/edit${theme === "light" ? "" : "light"}.png`
                : `/check${theme === "light" ? "" : "light"}.png`
            }
            height={20}
            width={20}
            alt="edit"
          ></Image>
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default Profile;
