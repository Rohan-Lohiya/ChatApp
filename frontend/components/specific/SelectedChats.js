"use client";
import React, { useMemo, useEffect, useRef, useState } from "react";
import styles from "./selectedchats.module.css";
import { useSelector } from "react-redux";
import Image from "next/image";

const SelectedChats = ({ GoogleID }) => {
  const mygoogleID = useSelector((state) => state.selectedUser.mygoogleID);
  const messagesData = useSelector((state) => state.selectedUser.messages);
  const typingUsers = useSelector((state) => state.selectedUser.typingUsers);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMsgButton, setShowNewMsgButton] = useState(false);
  const [newmessage, setnewmessage] = useState(false);

  const chatWrapperRef = useRef(null);

  const filteredChats = useMemo(() => {
    return messagesData
      .filter((msg) => msg.from === GoogleID || msg.to === GoogleID)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [GoogleID, messagesData]);
  const prevChatsCount = useRef(filteredChats.length);
  const prevTypingUsers = useRef(typingUsers.length);

  const handleScroll = () => {
    const element = chatWrapperRef.current;
    if (!element) return;

    const threshold = 100;
    const position = element.scrollTop + element.clientHeight;
    const height = element.scrollHeight;

    const nearBottom = height - position <= threshold;
    setIsNearBottom(nearBottom);

    // Hide button if user scrolls down near bottom
    if (nearBottom) {
      setShowNewMsgButton(false);
    }
  };

  useEffect(() => {
    const element = chatWrapperRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const isNewMessage = filteredChats.length > prevChatsCount.current;
    const isTypingActivity = typingUsers.length > prevTypingUsers.current;

    if (!isNearBottom && (isNewMessage || isTypingActivity)) {
      setShowNewMsgButton(true);
    }

    prevChatsCount.current = filteredChats.length;
    prevTypingUsers.current = typingUsers.length;

    if (isNearBottom) {
      if (chatWrapperRef.current) {
        chatWrapperRef.current.scrollTo({
          top: chatWrapperRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
      setShowNewMsgButton(false); // Hide button if near bottom
    }
  }, [filteredChats, typingUsers, isNearBottom]);

  const scrollToBottom = () => {
    setnewmessage(false);
    if (chatWrapperRef.current) {
      chatWrapperRef.current.scrollTo({
        top: chatWrapperRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const checkread = (timestamp) => {
    const msg = messagesData.find((m) => m.timestamp === timestamp);
    if (!msg) return 3;
    if (!msg.delivered) return 3;
    if (msg.read) return 2;
    return 1;
  };

  let lastDate = "";

  return (
    <div ref={chatWrapperRef} className={styles.chatWrapper}>
      {filteredChats.map((chat, index) => {
        const isMe = chat.from === mygoogleID;
        const chatDate = formatDate(chat.timestamp);
        const showDate = chatDate !== lastDate;
        lastDate = chatDate;

        return (
          <React.Fragment key={index}>
            {showDate && <div className={styles.dateDivider}>{chatDate}</div>}
            <div className={isMe ? styles.chatRight : styles.chatLeft}>
              <div className={styles.individualchatcont}>
                <div className={styles.individualchattext}>{chat.text}</div>
                <div className={styles.individualchatdate}>
                  {formatTime(chat.timestamp)}
                </div>
                {isMe && (
                  <div className={styles.individualchatstatus}>
                    <Image
                      src={
                        checkread(chat.timestamp) === 1
                          ? "/delivered.png"
                          : checkread(chat.timestamp) === 2
                          ? "/read.png"
                          : "/sent.png"
                      }
                      height={20}
                      width={20}
                      alt="status"
                    />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {typingUsers.includes(GoogleID) && (
        <div className={styles.typingindicator}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      {showNewMsgButton && (
        <button className={styles.newmsgbutton} onClick={scrollToBottom}>
          New messages
        </button>
      )}
    </div>
  );
};

export default SelectedChats;
