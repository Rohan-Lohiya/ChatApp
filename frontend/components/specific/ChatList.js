"use client";
import React, { useState } from "react";
import styles from "./chatlist.module.css";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedGoogleID,
  setmessagefromread,
  setisgroupselected,
  setgroupmessagefromread,
} from "@/app/store/selectedUserSlice";
import { useEffect } from "react";
import socket from "../socket";

const ChatList = () => {
  const dispatch = useDispatch();
  const selectedGoogleID = useSelector((state) => state.selectedUser.googleID);
  const totalpeople = useSelector((state) => state.selectedUser.totalPeople);
  const messages = useSelector((state) => state.selectedUser.messages);
  const groupdata = useSelector((state) => state.selectedUser.groupdata);
  const totalgroup = useSelector((state) => state.selectedUser.totalgroup);
  const groupselected = useSelector(
    (state) => state.selectedUser.isgroupselected
  );
  const myGoogleID = useSelector((state) => state.selectedUser.mygoogleID);

  useEffect(() => {
    if (selectedGoogleID) {
      console.log("Selected Google ID:", selectedGoogleID);
      if (!groupselected) {
      socket.emit("mark-as-read", selectedGoogleID);
      dispatch(setmessagefromread(selectedGoogleID));
    }
    else{
      socket.emit("group-mark-as-read", selectedGoogleID);
    }
    }
  }, [selectedGoogleID]);

  const handleClick = (googleID) => {
    dispatch(setisgroupselected(false));
    dispatch(setSelectedGoogleID(googleID));
  };

  const getUnreadCount = (googleID) => {
    return messages.filter((msg) => msg.from === googleID && !msg.read).length;
  };
  const handleGroupClick = (groupID) => {
    dispatch(setisgroupselected(true));
    dispatch(setSelectedGoogleID(groupID));
  };
  const getGroupUnreadCount = (groupID) => {
    const group = groupdata.find((g) => g.groupID === groupID);
    if (!group) return 0;
    else {
      const unreadCount = group.groupMessages.filter(
        (msg) => msg.from !== myGoogleID && !msg.readBy.includes(myGoogleID)
      ).length;

      return unreadCount;
    }
  };

  return (
    <div className={styles.chatContainer}>
      {groupdata.map((group, index) => {
        const unreadCount = getGroupUnreadCount(group.groupID);

        return (
          <div
            key={index}
            className={`${styles.chatItem} ${
              selectedGoogleID === group.groupID ? styles.isselected : ""
            }`}
            onClick={() => handleGroupClick(group.groupID)}
          >
            <span className={styles.avatar}>
              <Image
                src={group.groupImage}
                height={40}
                width={40}
                alt={group.groupName || "User avatar"}
              />
            </span>
            <span className={styles.chatInfo}>
              <div className={styles.friendName}>{group.groupName}</div>
              <div className={styles.newMessages}>
                {unreadCount > 0
                  ? `${unreadCount} new message(s)`
                  : "No new messages"}
              </div>
            </span>
            <hr className={styles.linebreak} />
          </div>
        );
      })}

      {totalpeople.map((friend, index) => {
        const unreadCount = getUnreadCount(friend.GoogleID);

        return (
          <div
            key={index}
            className={`${styles.chatItem} ${
              selectedGoogleID === friend.GoogleID ? styles.isselected : ""
            }`}
            onClick={() => handleClick(friend.GoogleID)}
          >
            <span className={styles.avatar}>
              <Image
                src={friend.image}
                height={40}
                width={40}
                alt={friend.name || "User avatar"}
              />
            </span>
            <span className={styles.chatInfo}>
              <div className={styles.friendName}>{friend.name}</div>
              <div className={styles.newMessages}>
                {unreadCount > 0
                  ? `${unreadCount} new message(s)`
                  : "No new messages"}
              </div>
            </span>
            <hr className={styles.linebreak} />
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
