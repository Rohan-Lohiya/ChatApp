'use client';
import React from 'react';
import axios from 'axios';
import socket from '../socket';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setChatData,
  setmygoogleID,
  setmyname,
  setmyprofileimage,
  addMessage,
  pushonline,
  removeonline,
  setaddpeople,
  setdelivered,
  setread,
  pushActive,
  removeActive,
  addTypingUser,
  removeTypingUser,
  setgroupdata,
  setabout,
  addgroupmessage,
  setgroupmessagefromread,
  setgroupdelivered,
  setaddgroupmembers,
  setaddgroup,
  setgroupAdmin,
  setmemberremoval,
  setSelectedGoogleID,
  removefriend,
  addgrouptypingusers,
  removegrouptypingusers,
  settoken,
  setgroupdescription,
  setdeletemessage,
  deletegroupmessage,
  deletegroupmsgbyadmin,
} from '@/app/store/selectedUserSlice';

export function useSocketAndChatData(session) {
  const [isLoading, setisLoading] = useState(true);
  const [error, seterror] = useState(null);
  const [hasFetched, sethasFetched] = useState(false);
  const dispatch = useDispatch();
  const friend = useSelector(state => state.selectedUser.totalPeople);
  const mygoogleID = useSelector(state => state.selectedUser?.mygoogleID);

  // ✅ Still set token in Redux for other components to use
  useEffect(() => {
    if (session?.backendToken) {
      dispatch(settoken(session.backendToken));
    }
  }, [session, dispatch]);

  useEffect(() => {
    if (!session?.user?.email || hasFetched) return;

    // ✅ Check if we have the token from session
    if (!session?.backendToken) {
      console.log('No backend token in session yet, waiting...');
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const fetchOrRegisterUser = async () => {
      try {
        setisLoading(true);
        const googleID = session.user.email;

        // ✅ Use session.backendToken directly

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/get-chat-data`,
          {}, // Empty data object since your backend doesn't expect any body data
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.backendToken}`, // ✅ Use session token directly
            },
          }
        );

        if (response.data?.chatData) {
          console.log('✅ Chat data fetched:', response.data);
          dispatch(setChatData(response.data.chatData));
          dispatch(setgroupdata(response.data.groupdata));
          dispatch(setmygoogleID(response.data.chatData.myGoogleID));
          dispatch(setmyname(response.data.chatData.name));
          dispatch(setmyprofileimage(response.data.chatData.image));
          dispatch(setabout(response.data.chatData.about));
          sethasFetched(true);
        }
      } catch (err) {
        console.error('⚠️ Error fetching chat data:', err);
        seterror(err.response?.data?.error || 'Failed to fetch chat data');
        if (err.response?.status === 404) {
          console.log('🆕 Registering user:', session.user.email);
          socket.emit('register-user', {
            googleIdOrEmail: session.user.email,
            imageURL: session.user.image,
            name: session.user.name,
          });
          fetchOrRegisterUser();
        }
      } finally {
        setisLoading(false);
      }
    };

    const onConnect = () => {
      console.log('socket connected:', socket.id);
      socket.emit('register-user', {
        googleIdOrEmail: session.user.email,
        imageURL: session.user.image,
        name: session.user.name,
      });
      fetchOrRegisterUser();
    };
    const onRegistrationComplete = data => {
      console.log('User registered:', data);
    };
    const onReceiveMessage = data => {
      console.log('Message received:', data);
      dispatch(
        addMessage({
          from: data.from,
          to: data.to,
          text: data.text,
          timestamp: data.timestamp,
          read: data.read,
          delivered: data.delivered,
        })
      );
    };
    const onReceiveaddfriend = data => {
      console.log('Friend request received:', data);
      const friendexist = friend.find(friend => friend.GoogleID === data.googleID);
      if (!friendexist) {
        dispatch(
          setaddpeople({
            name: data.name,
            GoogleID: data.googleID,
            image: data.image,
          })
        );
      }
    };
    const onReceiveGroupMessage = data => {
      console.log('Group message received: ', data);
      dispatch(
        addgroupmessage({
          groupID: data.groupID,
          message: data,
        })
      );
    };
    const onGroupMessageRead = data => {
      console.log('group message read by: ', data);
      dispatch(
        setgroupmessagefromread({
          GoogleID: data.GoogleID,
          groupID: data.groupID,
        })
      );
    };
    const onGroupUserOnline = data => {
      console.log('group user online: ', data);
      dispatch(setgroupdelivered({ GoogleID: data.GoogleID, groupID: data.groupID }));
    };
    const onGroupMemberAdded = data => {
      const { formattedMembers, groupID } = data;
      dispatch(setaddgroupmembers({ formattedMembers, groupID }));
    };
    const onNewGroupJoined = data => {
      dispatch(setaddgroup(data));
      console.log('joined new group');
    };
    const onGroupAdminUpdate = data => {
      dispatch(setgroupAdmin(data));
    };
    const onGroupMemberRemoval = data => {
      if (data.removedmember === mygoogleID) {
        dispatch(setSelectedGoogleID(''));
      }
      dispatch(setmemberremoval(data));
    };
    const ongroupdescriptionchanged = data => {
      dispatch(setgroupdescription(data));
    };

    socket.on('connect', onConnect);
    socket.on('receive-message', onReceiveMessage);
    socket.on('registration-complete', onRegistrationComplete);
    socket.on('recieve-add-friend', onReceiveaddfriend);
    socket.on('receive-groupmessage', onReceiveGroupMessage);
    socket.on('group-message-read', onGroupMessageRead);
    socket.on('group-user-online', onGroupUserOnline);
    socket.on('groupmemberadded', onGroupMemberAdded);
    socket.on('newgroupjoined', onNewGroupJoined);
    socket.on('group-admin-update', onGroupAdminUpdate);
    socket.on('removed-group-member', onGroupMemberRemoval);
    socket.on('group-description-changed', ongroupdescriptionchanged);
    socket.on('deletefriend', data => {
      dispatch(removefriend(data));
    });
    socket.on('user-online', data => {
      console.log('🟢 User online:', data);
      dispatch(
        pushonline({
          GoogleID: data.GoogleID || data.googleID,
          name: data.name,
        })
      );
      dispatch(setdelivered({ GoogleID: data.GoogleID || data.googleID }));
    });
    socket.on('user-offline', data => {
      console.log('🔴 User offline:', data);
      dispatch(
        removeonline({
          GoogleID: data.GoogleID || data.googleID, // Handle both cases
        })
      );
      dispatch(removeActive(data));
    });
    socket.on('message-read', data => {
      console.log('message read by :', data.GoogleID);
      dispatch(setread(data.GoogleID));
      dispatch(pushActive(data));
    });
    socket.on('not-active', data => {
      console.log('User not active', data);
      dispatch(removeActive(data));
    });
    socket.on('usertyping', ({ from }) => {
      console.log('User typing:', from);
      dispatch(addTypingUser(from));
    });

    socket.on('userstopTyping', ({ from }) => {
      console.log('User stopped typing:', from);
      dispatch(removeTypingUser(from));
    });
    socket.on('groupusertyping', data => {
      console.log('User typing:', data);
      dispatch(addgrouptypingusers(data));
    });

    socket.on('groupuserstopTyping', data => {
      console.log('User stopped typing:', data);
      dispatch(removegrouptypingusers(data));
    });
    socket.on('messagesDeletedMe', data => {
      dispatch(setdeletemessage(data));
    });
    socket.on('messagesDeletedEveryone', data => {
      dispatch(setdeletemessage(data));
    });
    socket.on('groupMessagesDeleted', data => {
      dispatch(deletegroupmessage(data));
    });
    socket.on('groupMessagesDeletedByAdmin', data => {
      dispatch(deletegroupmsgbyadmin(data));
    });
    socket.on('error', data => {
      console.log('error', data);
    });

    return () => {
      socket.off('connect', onConnect);
    };
  }, [session, hasFetched]); // ✅ Depend on session, which includes backendToken

  return { isLoading, error };
}
