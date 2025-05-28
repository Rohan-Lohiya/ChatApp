'use client';
import React from 'react';
import styles from './selectedgroupchats.module.css';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Image from 'next/image';
import socket from '../socket';

const SelectedGroupChats = () => {
  const groupdata = useSelector(state => state.selectedUser.groupdata);
  const isgroupselected = useSelector(state => state.selectedUser.isgroupselected);
  const grouptypingusers = useSelector(state => state.selectedUser.grouptypingusers);
  const selectedGoogleID = useSelector(state => state.selectedUser.googleID);
  const mygoogleID = useSelector(state => state.selectedUser.mygoogleID);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMsgButton, setShowNewMsgButton] = useState(false);
  const [newmessage, setnewmessage] = useState(false);
  const [selectedchat, setselectedchat] = useState({ from: '', timestamp: '' });
  const [dropdownDirection, setDropdownDirection] = useState({});
  const [checkAdmin, setcheckAdmin] = useState(false);

  const chatOptionRefs = useRef({});
  const groupchatWrapperRef = useRef(null);
  const group = useMemo(() => {
    return groupdata.find(g => g.groupID === selectedGoogleID);
  }, [groupdata, selectedGoogleID]);

  const groupmessages = useMemo(() => {
    return group?.groupMessages || [];
  }, [group]);

  const filteredGroupChats = useMemo(() => {
    return [...groupmessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [selectedGoogleID, groupmessages]);

  const prevChatsCount = useRef(filteredGroupChats.length);
  const prevTypingUsers = useRef(grouptypingusers.length);

  const handleScroll = () => {
    const element = groupchatWrapperRef.current;
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
    const element = groupchatWrapperRef.current;
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
    const isNewMessage = filteredGroupChats.length > prevChatsCount.current;
    const isTypingActivity = grouptypingusers.length > prevTypingUsers.current;
    const admin = group?.groupAdmin?.some(admin => admin.GoogleID === mygoogleID) ?? false;
    setcheckAdmin(admin);

    if (!isNearBottom && (isNewMessage || isTypingActivity)) {
      setShowNewMsgButton(true);
    }

    prevChatsCount.current = filteredGroupChats.length;
    prevTypingUsers.current = grouptypingusers.length;

    if (isNearBottom) {
      if (groupchatWrapperRef.current) {
        groupchatWrapperRef.current.scrollTo({
          top: groupchatWrapperRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
      setShowNewMsgButton(false); // Hide button if near bottom
    }
  }, [filteredGroupChats, grouptypingusers, isNearBottom]);

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
    if (groupchatWrapperRef.current) {
      groupchatWrapperRef.current.scrollTo({
        top: groupchatWrapperRef.current.scrollHeight,
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
    const msg = groupmessages.find(m => m.timestamp === timestamp);
    if (!msg) return 3;
    if (!msg.delivered) return 3;
    if (msg.read) return 2;
    return 1;
  };
  let lastDate = '';
  const chatpersonimage = fromID => {
    if (group) {
      const user = group.members.find(person => person.GoogleID === fromID);
      if (user) {
        return user.imageURL;
      } else {
        return '/group.png';
      }
    }
  };
  const chatpersonname = fromID => {
    if (group) {
      const user = group.members.find(person => person.GoogleID === fromID);
      if (user) {
        return user.name;
      } else {
        return '/pata nahi kaun ha';
      }
    }
  };
  const getimageurlformID = fromID => {
    console.log('fromID', fromID);
    if (group) {
      const user = group.members.find(person => person.GoogleID === fromID);
      return user ? user.imageURL : '/group.png';
    }
    return '/group.png'; // Default image if not found
  };
  const handlearrowclick = (item, index) => {
    console.log(item);
    const chatKey = `${item.from}-${item.timestamp}`;
    const currentSelectedKey = `${selectedchat.from}-${selectedchat.timestamp}`;

    const chatElement = document.getElementById(`groupchat-${chatKey}`);
    const wrapperElement = groupchatWrapperRef.current;

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

  const handlegroupmsgdelete = chat => {
    socket.emit('delete-group-message', { data: [chat], groupID: selectedGoogleID });
  };
  const handlemsgdeletebyadmin = chat => {
    socket.emit('del-grp-mes-byAdmin', { data: [chat], groupID: selectedGoogleID });
  };

  return (
    <div ref={groupchatWrapperRef} className={styles.chatWrapper}>
      {filteredGroupChats.map((chat, index) => {
        const isMe = chat.from === mygoogleID;
        const chatDate = formatDate(chat.timestamp);
        const showDate = chatDate !== lastDate;
        lastDate = chatDate;
        const chatKey = `${chat.from}-${chat.timestamp}`;
        const isSelected = selectedchat.from === chat.from && selectedchat.timestamp === chat.timestamp;

        return (
          <React.Fragment key={index}>
            {showDate && <div className={styles.dateDivider}>{chatDate}</div>}
            {chat.messagetype === 'notification' && <div className={styles.dateDivider}>{chat.text}</div>}
            {chat.messagetype === 'delete' && (
              <div className={isMe ? styles.chatRight : styles.chatLeft}>
                {!isMe && (
                  <Image
                    className={styles.chatpersonimg}
                    src={chatpersonimage(chat.from)}
                    height={20}
                    width={20}
                    alt="UserImg"></Image>
                )}
                <div className={styles.individualchatcont}>
                  {!isMe && <div className={styles.individualchatname}>{chatpersonname(chat.from)}</div>}
                  <div className={styles.individualchattextdeleted}>{chat.text}</div>
                  <div className={styles.individualchatdate}>{formatTime(chat.timestamp)}</div>
                </div>
              </div>
            )}
            {chat.messagetype === 'text' && (
              <div className={isMe ? styles.chatRight : styles.chatLeft}>
                {!isMe && (
                  <Image
                    className={styles.chatpersonimg}
                    src={chatpersonimage(chat.from)}
                    height={20}
                    width={20}
                    alt="UserImg"></Image>
                )}
                <div className={styles.individualchatcont}>
                  {!isMe && <div className={styles.individualchatname}>{chatpersonname(chat.from)}</div>}
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
                    onClick={() => handlearrowclick(chat, index)}>
                    <Image src="/arrow.png" height={20} width={20} alt="more" />
                  </div>
                  {/* Conditionally render dropdown when selected */}
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
                      {isMe && <div onClick={() => handlegroupmsgdelete(chat)}>Delete for everyone</div>}
                      {!isMe && checkAdmin && (
                        <div onClick={() => handlemsgdeletebyadmin(chat)}>Delete this message</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
      {(() => {
        const currentTypingGroup = grouptypingusers.find(entry => entry.groupID === selectedGoogleID);
        const typingUsers = currentTypingGroup?.typingUsers?.filter(id => id !== mygoogleID) || [];

        if (typingUsers.length === 0) return null;

        return (
          <div className={styles.typingWrapper}>
            <div className={styles.typingImages}>
              {typingUsers.map(id => (
                <Image
                  key={id}
                  src={getimageurlformID(id)}
                  width={30}
                  height={30}
                  alt="Typing user"
                  className={styles.typingUserImg}
                />
              ))}
            </div>
            <div className={styles.typingindicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        );
      })()}

      {showNewMsgButton && (
        <button className={styles.newmsgbutton} onClick={scrollToBottom}>
          New messages
        </button>
      )}
    </div>
  );
};

export default SelectedGroupChats;
