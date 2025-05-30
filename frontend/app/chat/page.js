'use client';
import React from 'react';
import styles from './chat.module.css';
import Image from 'next/image';
import ChatList from '@/components/specific/ChatList';
import SelectedChats from '@/components/specific/SelectedChats';
import SendMessage from '@/components/specific/SendMessage';
import Settings from '@/components/specific/Settings';
import Profile from '@/components/specific/Profile';
import AddChat from '@/components/specific/AddChat';
import Searchinput from '@/components/specific/Searchinput';
import AddGroup from '@/components/specific/AddGroup';
import SelectedGroupChats from '@/components/specific/SelectedGroupChats';
import SelectedChatsInfo from '@/components/specific/SelectedChatsInfo';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useEffect, useState, useMemo } from 'react';
import { useRef } from 'react';
import { useSession } from 'next-auth/react';
import { clearchat, removefriend, setSelectedGoogleID, settoken } from '../store/selectedUserSlice';
import { redirect } from 'next/navigation';
import { useSocketAndChatData } from '@/components/specific/useSocketAndChatData';
import axios from 'axios';

const page = () => {
  const selectedGoogleID = useSelector(state => state.selectedUser.googleID);
  const isonline = useSelector(state => state.selectedUser.online);
  const totalPeople = useSelector(state => state.selectedUser.totalPeople);
  const groupdata = useSelector(state => state.selectedUser.groupdata);
  const messages = useSelector(state => state.selectedUser.messages);
  const isgroupselected = useSelector(state => state.selectedUser.isgroupselected);
  const token = useSelector(state => state.selectedUser.token);

  const [isselectedGID, setisselectedGID] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [clearchatpressed, setclearchatpressed] = useState(false);
  const [deletechatpressed, setdeletechatpressed] = useState(false);
  const [firstdivselected, setfirstdivselected] = useState('1');
  const [addchatpressed, setaddchatpressed] = useState(false);
  const [addgrouppressed, setaddgrouppressed] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [Loading, setLoading] = useState(false);

  const menuRef = useRef(null);
  const imageRef = useRef(null);
  const clearchatref = useRef(null);
  const deletechatref = useRef(null);
  const addchatref = useRef(null);
  const addgroupref = useRef(null);
  const dispatch = useDispatch();
  const { data: session } = useSession();

  const selectedName = GoogleID => {
    if (!isgroupselected) {
      const friend = totalPeople.find(friend => friend.GoogleID === GoogleID);
      return friend ? friend.name : 'Unknown'; // Return 'Unknown' if no match is found
    } else {
      const group = groupdata.find(group => group.groupID === GoogleID);
      return group ? group.groupName : 'Unknown'; // Return 'Unknown' if no match is found
    }
  };

  const selectedavtar = GoogleID => {
    if (!isgroupselected) {
      const friend = totalPeople.find(friend => friend.GoogleID === GoogleID);
      return friend ? friend.image : '/chad.jpeg'; // Return 'Unknown' if no match is found
    } else {
      const group = groupdata.find(group => group.groupID === GoogleID);
      return group ? group.groupImage : '/chad.jpeg'; // Return 'Unknown' if no match is found
    }
  };

  useEffect(() => {
    if (session === null) {
      redirect('/login');
    }
  }, [session]);

  useEffect(() => {
    if (session?.backendToken) {
      dispatch(settoken(session.backendToken)); // ✅ now this is your custom JWT for backend
    }
  }, [session, dispatch]);

  const isUserOnline = useMemo(
    () => selectedGoogleID && isonline.some(friend => friend.GoogleID === selectedGoogleID),
    [isonline, selectedGoogleID]
  );

  useEffect(() => {
    setisselectedGID(!!selectedGoogleID);
  }, [selectedGoogleID]);

  useEffect(() => {
    const handleClickOutside = event => {
      const isClickOutsideMenu = !menuRef.current || !menuRef.current.contains(event.target);
      const isClickOutsideImage = !imageRef.current || !imageRef.current.contains(event.target);
      const isClickOutsideClearChat = !clearchatref.current || !clearchatref.current.contains(event.target);
      const isClickOutsideDeleteChat = !deletechatref.current || !deletechatref.current.contains(event.target);
      const isClickOutsideAddChat = !addchatref.current || !addchatref.current.contains(event.target);
      const isClickOutsideAddGroup = !addgroupref.current || !addgroupref.current.contains(event.target);

      if (
        isClickOutsideMenu &&
        isClickOutsideImage &&
        isClickOutsideClearChat &&
        isClickOutsideDeleteChat &&
        isClickOutsideAddChat &&
        isClickOutsideAddGroup
      ) {
        setMenuVisible(false);
        setclearchatpressed(false);
        setdeletechatpressed(false);
        setaddchatpressed(false);
        setaddgrouppressed(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { isLoading, error } = useSocketAndChatData(session);

  if (session === undefined) return <p>Loading session...</p>; // still loading
  if (isLoading) return <p>Loading chat data...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!session) return <p>You must be signed in to chat.</p>;

  const handlemoreheadingoption = () => {
    console.log('More options clicked for Google ID:', selectedGoogleID);
    setMenuVisible(prev => !prev);
  };
  const handleclosechat = () => {
    console.log('Close chat clicked for Google ID:', selectedGoogleID);
    setisselectedGID(false);
  };
  const handleclearchat = async () => {
    console.log('Clear chat clicked for Google ID:', selectedGoogleID);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/clear-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Securely pass token
      },
      body: JSON.stringify({
        todeleteUserID: selectedGoogleID, // ✅ Changed key name to match backend expectation
      }),
    });

    if (!res.ok) {
      const text = await res.text(); // read raw response
      throw new Error(`Request failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    console.log(data);
    dispatch(clearchat(selectedGoogleID));
    setclearchatpressed(false);
  };
  const handledeletechat = async () => {
    console.log('Delete chat clicked for Google ID:', selectedGoogleID);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/delete-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Securely pass token
      },
      body: JSON.stringify({
        todeleteUserID: selectedGoogleID, // ✅ Changed key name to match backend expectation
      }),
    });

    if (!res.ok) {
      const text = await res.text(); // read raw response
      throw new Error(`Request failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    console.log(data);
    dispatch(removefriend(selectedGoogleID));
    setSelectedGoogleID(null);
    setisselectedGID(false);
    setdeletechatpressed(false);
  };
  const handlesetfirstdivselected = value => {
    setfirstdivselected(value);
    value !== '1' && setisselectedGID(false);
  };

  return (
    <>
      {clearchatpressed && (
        <div className={styles.whitescreen}>
          <div
            ref={clearchatref}
            className={`${styles.confirmclearcont} ${clearchatpressed ? styles.confirmclearcontVisible : ''}`}>
            <h2>Clear this chat?</h2>
            <h5>Chat will be empty but will be remain in list</h5>
            <div className={styles.flexcenterspacearound}>
              <div
                onClick={() => {
                  setclearchatpressed(false);
                }}
                className={styles.clearchatoptioncancel}>
                Cancel
              </div>
              <div onClick={handleclearchat} className={styles.clearchatoptionclear}>
                Clear chat
              </div>
            </div>
          </div>
        </div>
      )}
      {deletechatpressed && (
        <div className={styles.whitescreen}>
          <div
            ref={deletechatref}
            className={`${styles.confirmclearcont} ${deletechatpressed ? styles.confirmclearcontVisible : ''}`}>
            <h2>Delete this chat?</h2>
            <h5>Chat and data will be removed</h5>
            <div className={styles.flexcenterspacearound}>
              <div
                onClick={() => {
                  setdeletechatpressed(false);
                }}
                className={styles.clearchatoptioncancel}>
                Cancel
              </div>
              <div onClick={handledeletechat} className={styles.clearchatoptionclear}>
                Delete chat
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.backgroundcont}>
        <div className={styles.container}>
          <div className={styles.first}>
            <div
              onClick={() => handlesetfirstdivselected('1')}
              className={`${styles.iconWrapper} ${firstdivselected === '1' ? styles.selected : ''}`}>
              <Image
                className={styles.chatselect}
                src={firstdivselected === '1' ? '/chatselect.png' : '/chatnotselect.png'}
                width={40}
                height={40}
                alt="chat"
              />
            </div>

            <div
              onClick={() => handlesetfirstdivselected('2')}
              className={`${styles.iconWrapper} ${firstdivselected === '2' ? styles.selected : ''}`}>
              <Image
                className={styles.settingselect}
                src={firstdivselected === '2' ? '/settingselected.png' : '/settingsnotselected.png'}
                width={40}
                height={40}
                alt="setting"
              />
            </div>

            <div
              onClick={() => handlesetfirstdivselected('3')}
              className={`${styles.iconWrapper} ${firstdivselected === '3' ? styles.selected : ''} ${
                styles.avtarselectcont
              }`}>
              <Image className={styles.avtarselect} src={session.user.image} width={40} height={40} alt="avtar" />
            </div>
          </div>
          <hr className={styles.break} />
          <div className={styles.second}>
            <div className={styles.secondheading}>
              <span className={styles.secondheadingheading}>
                {firstdivselected === '1' ? 'Chats' : firstdivselected === '2' ? 'Settings' : 'Profile'}
              </span>
              {firstdivselected === '1' && (
                <span className={styles.imagecont}>
                  <span className={styles.addchatimgcont}>
                    <Image
                      onClick={() => setaddchatpressed(true)}
                      className={styles.optImage}
                      src={'/addchat.png'}
                      width={25}
                      height={25}
                      alt="AddChat"></Image>
                    {addchatpressed && (
                      <span ref={addchatref} className={styles.addchatcont}>
                        <AddChat />
                      </span>
                    )}
                  </span>
                  <span className={styles.addgroupimgcont}>
                    <Image
                      onClick={() => setaddgrouppressed(!addgrouppressed)}
                      className={styles.optImage}
                      src={'/group.png'}
                      width={40}
                      height={40}
                      alt="Group"></Image>
                    <div
                      className={`${styles.whitescreennew} ${
                        addgrouppressed ? styles.showwhitescreennew : styles.hidewhitescreennew
                      }`}>
                      <span
                        ref={addgroupref}
                        className={`${styles.addgroupcont} ${
                          addgrouppressed ? styles.addgroupshow : styles.addgrouphide
                        }`}>
                        <AddGroup setaddgrouppressed={setaddgrouppressed} />
                      </span>
                    </div>
                  </span>
                </span>
              )}
            </div>
            {firstdivselected === '1' && (
              <>
                <div className={styles.searchCont}>
                  <Searchinput />
                </div>
                <div className={styles.chatlistcont}>
                  <ChatList />
                </div>
              </>
            )}
            {firstdivselected === '2' && (
              <div className={styles.settingspagecont}>
                <Settings />
              </div>
            )}
            {firstdivselected === '3' && (
              <div className={styles.profilepagecont}>
                <Profile />
              </div>
            )}
          </div>
          <hr className={styles.break} />
          <div className={`${styles.third} ${showAbout ? styles.showAbout : ''}`}>
            <div className={styles.thirdchatselectcont}>
              {!isselectedGID && (
                <div className={styles.flexcentercenter}>
                  <h1>Welcome</h1>
                  <div>Select chat to start</div>
                </div>
              )}
              {isselectedGID && (
                <>
                  <div className={styles.thirdheading}>
                    <span className={styles.selectedchatinfocont} onClick={() => setShowAbout(!showAbout)}>
                      <Image
                        className={styles.selectedavtarimage}
                        src={selectedavtar(selectedGoogleID)}
                        width={40}
                        height={40}
                        alt="Group"></Image>
                      <span className={styles.selectedavtarinfo}>
                        <span className={styles.selectedavtarname}>{selectedName(selectedGoogleID)}</span>
                        <span className={styles.isofflinespan}>
                          {isUserOnline ? 'Online' : selectedGoogleID ? 'Offline' : 'Unknown'}
                        </span>
                      </span>
                    </span>
                    <span className={styles.dropdownWrapper}>
                      <Image
                        ref={imageRef}
                        onClick={handlemoreheadingoption}
                        className={styles.moreoptimage}
                        src={'/more.png'}
                        width={40}
                        height={40}
                        alt="MoreOption"></Image>
                      {menuVisible && (
                        <div ref={menuRef} className={styles.moreoptioncont}>
                          <div onClick={handleclosechat} className={styles.moreoptionsinnercont}>
                            <div className={styles.moreoptions}>Close Chat</div>
                          </div>
                          {!isgroupselected && (
                            <>
                              <div
                                onClick={() => {
                                  setclearchatpressed(true);
                                  setMenuVisible(false);
                                }}
                                className={styles.moreoptionsinnercont}>
                                <div className={styles.moreoptions}>Clear Chat</div>
                              </div>
                              <div
                                onClick={() => {
                                  setdeletechatpressed(true);
                                  setMenuVisible(false);
                                }}
                                className={styles.moreoptionsinnercont}>
                                <div className={styles.moreoptions}>Delete Chat</div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </span>
                  </div>
                  {!isgroupselected ? (
                    <div className={styles.selectedchatcont}>
                      <SelectedChats GoogleID={selectedGoogleID} />
                    </div>
                  ) : (
                    <div className={styles.selectedchatcont}>
                      <SelectedGroupChats />
                    </div>
                  )}
                  <div className={styles.sendmessagecont}>
                    <SendMessage />
                  </div>
                </>
              )}
            </div>
            <div className={`${styles.selectedchataboutcont} ${showAbout ? styles.show : ''}`}>
              <SelectedChatsInfo setShowAbout={setShowAbout} setdeletechatpressed={setdeletechatpressed} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
