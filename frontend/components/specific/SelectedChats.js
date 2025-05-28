'use client';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import styles from './selectedchats.module.css';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import socket from '../socket';

const SelectedChats = ({ GoogleID }) => {
  const mygoogleID = useSelector(state => state.selectedUser.mygoogleID);
  const messagesData = useSelector(state => state.selectedUser.messages);
  const typingUsers = useSelector(state => state.selectedUser.typingUsers);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMsgButton, setShowNewMsgButton] = useState(false);
  const [newmessage, setnewmessage] = useState(false);
  const [selectedchat, setselectedchat] = useState({ from: '', timestamp: '' });
  const [dropdownDirection, setDropdownDirection] = useState({});

  const chatWrapperRef = useRef(null);
  // Change this to store multiple refs for each chat dropdown
  const chatOptionRefs = useRef({});

  const filteredChats = useMemo(() => {
    return messagesData
      .filter(msg => msg.from === GoogleID || msg.to === GoogleID)
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
      element.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
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
          behavior: 'smooth',
        });
      }
      setShowNewMsgButton(false); // Hide button if near bottom
    }
  }, [filteredChats, typingUsers, isNearBottom]);

  useEffect(() => {
    const handleClickOutside = event => {
      // Check if click is outside any chat option dropdown
      const isClickOutsideChatOption = Object.values(chatOptionRefs.current).every(
        ref => !ref || !ref.contains(event.target)
      );

      if (isClickOutsideChatOption) {
        setselectedchat({ from: '', timestamp: '' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    setnewmessage(false);
    if (chatWrapperRef.current) {
      chatWrapperRef.current.scrollTo({
        top: chatWrapperRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const formatDate = dateStr => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = dateStr => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const checkread = timestamp => {
    const msg = messagesData.find(m => m.timestamp === timestamp);
    if (!msg) return 3;
    if (!msg.delivered) return 3;
    if (msg.read) return 2;
    return 1;
  };

  const handlearrowclick = (item, index) => {
    const chatKey = `${item.from}-${item.timestamp}`;
    const currentSelectedKey = `${selectedchat.from}-${selectedchat.timestamp}`;

    const chatElement = document.getElementById(`chat-${chatKey}`);
    const wrapperElement = chatWrapperRef.current;

    if (chatElement && wrapperElement) {
      const chatRect = chatElement.getBoundingClientRect();
      const wrapperRect = wrapperElement.getBoundingClientRect();
      const chatMid = chatRect.top + chatRect.height / 2;
      const wrapperMid = wrapperRect.top + wrapperRect.height / 2;

      const direction = chatMid > wrapperMid ? 'up' : 'down';
      setDropdownDirection(prev => ({ ...prev, [chatKey]: direction }));
    }

    if (currentSelectedKey === chatKey) {
      setselectedchat({ from: '', timestamp: '' });
    } else {
      setselectedchat({ from: item.from, timestamp: item.timestamp });
    }
  };

  let lastDate = '';

  const handledeleteforme = chat => {
    console.log('delete message me presed');
    socket.emit('delete-message-me', [chat]);
  };
  const handledeleteforeveryone = chat => {
    console.log('delete message everyone presed');
    socket.emit('delete-message-everyone', { data: [chat], to: GoogleID });
  };

  return (
    <div ref={chatWrapperRef} className={styles.chatWrapper}>
      {filteredChats.map((chat, index) => {
        const isMe = chat.from === mygoogleID;
        const chatDate = formatDate(chat.timestamp);
        const showDate = chatDate !== lastDate;
        const chatKey = `${chat.from}-${chat.timestamp}`;
        const isSelected = selectedchat.from === chat.from && selectedchat.timestamp === chat.timestamp;
        lastDate = chatDate;

        return (
          <React.Fragment key={index}>
            {showDate && <div className={styles.dateDivider}>{chatDate}</div>}
            <div id={`chat-${chatKey}`} className={isMe ? styles.chatRight : styles.chatLeft}>
              <div className={styles.individualchatcont}>
                <div className={styles.individualchattext}>{chat.text}</div>
                <div className={styles.individualchatdate}>{formatTime(chat.timestamp)}</div>
                {isMe && (
                  <div className={styles.individualchatstatus}>
                    <Image
                      src={
                        checkread(chat.timestamp) === 1
                          ? '/delivered.png'
                          : checkread(chat.timestamp) === 2
                          ? '/read.png'
                          : '/sent.png'
                      }
                      height={20}
                      width={20}
                      alt="status"
                    />
                  </div>
                )}
                <div
                  className={`${styles.arrowIcon} ${isMe ? styles.bgright : styles.bgleft}`}
                  onClick={() => handlearrowclick(chat)}>
                  <Image src="/arrow.png" height={20} width={20} alt="more" />
                </div>
                {isSelected && (
                  <div
                    ref={el => {
                      if (el) {
                        chatOptionRefs.current[chatKey] = el;
                      }
                    }}
                    className={`${styles.individualchatoptcont} ${styles[dropdownDirection[chatKey] ?? 'down']} ${
                      isMe ? styles.showoptionleft : styles.showoptionright
                    }`}>
                    <div onClick={() => handledeleteforme(chat)}>Delete for me</div>
                    {isMe && <div onClick={() => handledeleteforeveryone(chat)}>Delete for everyone</div>}
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
