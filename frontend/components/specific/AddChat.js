"use client";
import React from "react";
import styles from "./addchat.module.css";
import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setaddpeople } from "@/app/store/selectedUserSlice";
import axios from "axios";
import socket from "../socket";

const AddChat = () => {
  const [available, setavailable] = useState(false);
  const [email, setemail] = useState("");
  const [disablebtn, setdisablebtn] = useState(false);
  const [message, setmessage] = useState(false);
  const [searchpeson, setsearchperson] = useState("");
    const dispatch = useDispatch();
    const userData = useRef(null);


  const handlechange = (e) => {
    const value = e.target.value;
    setemail(value);
  };

  const handlerefresh = () => {
    setemail(""); // Clear input
    setavailable(false); // Reset availability status
    setmessage(false); // Hide message
    setsearchperson(""); // Clear searched email
  };

  const handleclick = async (e) => {
    if (!available) {
      setdisablebtn(true);
      setsearchperson(email);
  
      if (email === "") {
        setavailable(false);
        setmessage(false);
        setdisablebtn(false);
        return alert("Fill search input first");
      }
  
      try {
        const response = await axios.post("http://localhost:5000/api/check-user", {
          googleID: email,
        });
  
        const { exists, user } = response.data;
        console.log("Backend Response:", response.data);
  
        if (exists) {
          setavailable(true);
          userData.current = user; // ✅ store user in ref
          console.log("User found:", user);
        } else {
          setavailable(false);
          userData.current = null;
        }
      } catch (err) {
        console.error("Error checking user:", err);
        setavailable(false);
      }
  
      setdisablebtn(false);
      setmessage(true);
      setemail("");
    } else {
      setavailable(false);
      setmessage(false);
      setemail("");
  
      if (userData.current) {
        const user = userData.current;
  
        dispatch(setaddpeople({
          name: user.name,
          GoogleID: user.googleID,
          image: user.image,
        }));
        console.log("Emitting add-friend:", {
          friendGoogleId: user.googleID,
          imageURL: user.image,
          name: user.name,
        });
        socket.emit("add-friend", {
          friendGoogleId: user.googleID,
          imageURL: user.image,
          name: user.name,
        });
        
        
  
        alert(`${user.name} added successfully`);
        userData.current = null; // Optional: reset after use
      } else {
        console.log("No user to add.");
      }
    }
  };
  
  
  


  return (
    <div className={styles.addchatcont}>
      <h2>Add People</h2>
      <div className={styles.inputcont}>
        <input
          onChange={handlechange}
          value={email}
          type="text"
          placeholder="Enter GmailID of your friend"
        />
        <button onClick={handlerefresh} className={styles.refreshbtn}>
          Refresh
        </button>
      </div>
      <button
        onClick={handleclick}
        disabled={disablebtn}
        className={styles.searchButton}
      >{`${available ? "Add" : "Search"}`}</button>
      {message && (
        <div>
          {available ? `${searchpeson} found` : `${searchpeson} not found`}
        </div>
      )}
    </div>
  );
};

export default AddChat;
