"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./sendmessage.module.css";
import { useSelector, useDispatch } from "react-redux";
import Image from "next/image";
import { addMessage, addgroupmessage } from "@/app/store/selectedUserSlice";
import socket from "../socket";

const SendMessage = () => {
  const selectedGoogleID = useSelector((state) => state.selectedUser.googleID);
  const mygoogleID = useSelector((state) => state.selectedUser.mygoogleID);
  const enterissend = useSelector((state) => state.selectedUser.enterissend);
  const online = useSelector((state) => state.selectedUser.online);
  const isActive = useSelector((state) => state.selectedUser.isActive);
  const isgroupselected = useSelector(
    (state) => state.selectedUser.isgroupselected
  );
  const groupdata = useSelector((state) => state.selectedUser.groupdata);
  const [message, setmessage] = useState("");
  const [group, setgroup] = useState([]);
  const dispatch = useDispatch();
  const typingTimeout = useRef(null);
  // const bottomRef = useRef(); // Optional: for autoscroll

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!e.shiftKey && enterissend) {
        e.preventDefault();
        if(isgroupselected){
          handlesendToGroup();
        }
        else{
          handleSend();
        }
        
      }
    }
  };

  const handleTyping = () => {
    if(!isgroupselected){
    socket.emit("typing", { to: selectedGoogleID, from: mygoogleID });
    } else {
      socket.emit("groupTyping", { to: selectedGoogleID, from: mygoogleID });
    }
    console.log("Typing event emitted");
  };

  const handleStopTyping = () => {
    if(!isgroupselected){
    socket.emit("stopTyping", { to: selectedGoogleID, from: mygoogleID });
  } else {
    socket.emit("groupStopTyping", { to: selectedGoogleID, from: mygoogleID });
    }
  };

  const handleChange = (e) => {
    setmessage(e.target.value);
    handleTyping();
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(handleStopTyping, 1000);
    e.target.style.height = "auto"; // Reset height
    e.target.style.height = e.target.scrollHeight + "px"; // Set to scroll height
  };

  const handleSend = () => {
    if (message.trim()) {
      handleStopTyping(); // Stop typing when sending a message
      // if selectedGoogleID is in online then dispatch messege
      const isOnline = online.some(
        (user) => user.GoogleID === selectedGoogleID
      );
      const isActiveUser = isActive.some(
        (user) => user.GoogleID === selectedGoogleID
      );
      if (isOnline) {
        dispatch(
          addMessage({
            from: mygoogleID,
            to: selectedGoogleID,
            text: message,
            timestamp: new Date().toISOString(),
            read: isActiveUser,
            delivered: true,
          })
        );
      } else {
        dispatch(
          addMessage({
            from: mygoogleID,
            to: selectedGoogleID,
            text: message,
            timestamp: new Date().toISOString(),
            read: false,
            delivered: false,
          })
        );
      }

      socket.emit("send-to-user", {
        userroom: selectedGoogleID,
        message: message,
      });
      setmessage("");

      // Optional: scroll to bottom
      // bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      console.log("Message is empty!");
    }
  };
  const handlesendToGroup = () => {
    if (isgroupselected) {
      handleStopTyping(); // Stop typing when sending a message
      if (group) {
        socket.emit("send-to-group", {
          groupID: selectedGoogleID,
          message: message,
        });
        setmessage("");
      }
    }
  };

  useEffect(() => {
    const usergroup = groupdata.find(
      (group) => group.groupID === selectedGoogleID
    );
    if (usergroup) {
      setgroup(usergroup);
    }
  }, [selectedGoogleID]);

  return (
    <div className={styles.sendmessagecont}>
      <div className={styles.sendinputcont}>
        {/* Use textarea if you want multi-line input */}
        <textarea
          className={styles.sendmessageinput}
          value={message}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          placeholder="Type a Message"
          rows={1} // You can adjust or make dynamic
        />
      </div>
      <div className={styles.sendimagecont}>
        <Image
          onClick={isgroupselected ? handlesendToGroup : handleSend}
          src={"/send.png"}
          height={40}
          width={40}
          alt="Send"
        />
      </div>
      {/* Optional scroll marker */}
      {/* <div ref={bottomRef}></div> */}
    </div>
  );
};

export default SendMessage;
