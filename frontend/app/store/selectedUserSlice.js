'use client';
import { createSlice } from '@reduxjs/toolkit';
import chatData from '@/components/specific/chatData';

const initialState = {
  mygoogleID: '',
  googleID: '',
  myname: '',
  about: 'Time pass only',
  myprofileimage: '',
  totalPeople: [],
  messages: [],
  online: [], // fallback if online is not in chatData
  isActive: [],
  typingUsers: [],
  totalgroup: [],
  groupdata: [],
  webtheme: 'light',
  enterissend: true,
  isgroupselected: false,
  token: '',
  grouptypingusers: [],
};

const selectedUserSlice = createSlice({
  name: 'selectedUser',
  initialState,
  reducers: {
    setisgroupselected: (state, action) => {
      state.isgroupselected = action.payload;
    },
    setSelectedGoogleID: (state, action) => {
      state.googleID = action.payload;
    },
    setChatData: (state, action) => {
      state.totalPeople = action.payload.friends;
      state.messages = action.payload.messages;
      state.online = action.payload.onlineUsers;
      state.isActive = action.payload.isActive;
      state.totalgroup = action.payload.totalgroup;
    },
    setgroupdata: (state, action) => {
      state.groupdata = action.payload;
    },
    setaddgroup: (state, action) => {
      const { groupID, groupName, groupImage, description, members, groupAdmin } = action.payload;

      const newGroup = {
        groupID,
        groupName,
        groupImage,
        description,
        members, // your info already included
        groupAdmin, // your info already included
        groupMessages: [],
      };

      state.groupdata.push(newGroup);
      state.totalgroup.push({
        groupID,
        members,
      });
    },

    setaddpeople: (state, action) => {
      state.totalPeople.push(action.payload);
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    markAsRead: (state, action) => {
      const from = action.payload;
      state.messages = state.messages.map(msg => (msg.from === from ? { ...msg, read: true } : msg));
    },
    setonline: (state, action) => {
      state.online = action.payload;
    },
    pushonline: (state, action) => {
      const newUser = action.payload;
      if (!state.online.some(user => user.GoogleID === newUser.GoogleID)) {
        state.online.push(newUser); // Now expects object with GoogleID
      }
    },
    removeonline: (state, action) => {
      const GoogleIDToRemove = action.payload.GoogleID;
      state.online = state.online.filter(user => user.GoogleID !== GoogleIDToRemove);
    },
    setmygoogleID: (state, action) => {
      state.mygoogleID = action.payload;
    },
    setmyprofileimage: (state, action) => {
      state.myprofileimage = action.payload;
    },
    clearchat: (state, action) => {
      const googleIDToClear = action.payload;
      state.messages = state.messages.filter(
        msg =>
          !(
            (msg.from === googleIDToClear && msg.to === state.mygoogleID) ||
            (msg.to === googleIDToClear && msg.from === state.mygoogleID)
          )
      );
    },
    removefriend: (state, action) => {
      const googleIDToRemove = action.payload;
      state.totalPeople = state.totalPeople.filter(friend => friend.GoogleID !== googleIDToRemove);
      state.messages = state.messages.filter(
        msg =>
          !(
            (msg.from === googleIDToRemove && msg.to === state.mygoogleID) ||
            (msg.to === googleIDToRemove && msg.from === state.mygoogleID)
          )
      );
    },
    setmyname: (state, action) => {
      state.myname = action.payload;
    },
    setabout: (state, action) => {
      state.about = action.payload;
    },
    setwebTheme: (state, action) => {
      state.theme = action.payload;
    },
    setenterissend: (state, action) => {
      state.enterissend = action.payload;
    },
    setdelivered: (state, action) => {
      const onlineId = action.payload.GoogleID;
      state.messages = state.messages.map(message => {
        if (message.to === onlineId && !message.delivered) {
          return { ...message, delivered: true };
        }
        return message;
      });
    },
    setread: (state, action) => {
      const onlineId = action.payload;
      state.messages = state.messages.map(message => {
        if (message.to === onlineId && !message.read) {
          return { ...message, read: true };
        }
        return message;
      });
    },
    pushActive: (state, action) => {
      const newUser = action.payload;
      if (!state.isActive.some(user => user.GoogleID === newUser.GoogleID)) {
        state.isActive.push(newUser); // Now expects object with GoogleID
      }
    },
    removeActive: (state, action) => {
      const GoogleIDToRemove = action.payload.GoogleID;
      state.isActive = state.isActive.filter(user => user.GoogleID !== GoogleIDToRemove);
    },
    setmessagefromread: (state, action) => {
      const from = action.payload;
      state.messages = state.messages.map(msg => (msg.from === from ? { ...msg, read: true } : msg));
    },
    addTypingUser: (state, action) => {
      const GoogleID = action.payload;
      if (!state.typingUsers.includes(GoogleID)) {
        state.typingUsers.push(GoogleID);
      }
    },
    removeTypingUser: (state, action) => {
      const GoogleID = action.payload;
      state.typingUsers = state.typingUsers.filter(id => id !== GoogleID);
    },
    addgrouptypingusers: (state, action) => {
      const { groupID, GoogleID } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (!group) return;

      const grouptypinguser = state.grouptypingusers.find(g => g.groupID === groupID);
      if (!grouptypinguser) {
        state.grouptypingusers.push({ groupID, typingUsers: [GoogleID] });
      } else {
        if (!grouptypinguser.typingUsers.includes(GoogleID)) {
          grouptypinguser.typingUsers.push(GoogleID);
        }
      }
    },
    removegrouptypingusers: (state, action) => {
      const { groupID, GoogleID } = action.payload;
      const grouptypinguser = state.grouptypingusers.find(g => g.groupID === groupID);
      if (grouptypinguser) {
        grouptypinguser.typingUsers = grouptypinguser.typingUsers.filter(id => id !== GoogleID);
      }
    },
    setgroupmessagefromread: (state, action) => {
      const { GoogleID, groupID } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (!group) return;

      const presentMembers = group.members.filter(m => m.present);
      const presentCount = presentMembers.length;

      group.groupMessages = group.groupMessages.map(msg => {
        // Skip if already read by this user
        const alreadyRead = msg.readBy.includes(GoogleID);
        const newReadBy = alreadyRead ? msg.readBy : [...msg.readBy, GoogleID];

        const allHaveRead = newReadBy.length >= presentCount;

        return {
          ...msg,
          readBy: newReadBy,
          read: allHaveRead,
        };
      });
    },

    addgroupmessage: (state, action) => {
      const { groupID, message } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (group) {
        group.groupMessages.push(message);
      }
    },
    setgroupdelivered: (state, action) => {
      const { GoogleID, groupID } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (!group) return;

      group.groupMessages = group.groupMessages.map(msg => {
        let updatedMsg = msg;
        if (!msg.deliveredTo.includes(GoogleID)) {
          updatedMsg = {
            ...msg,
            deliveredTo: [...msg.deliveredTo, GoogleID],
          };
        }
        // If all members have read, set read: true
        if (group.members.length === updatedMsg.deliveredTo.length) {
          updatedMsg = {
            ...updatedMsg,
            delivered: true,
          };
        }
        return updatedMsg;
      });
    },
    setaddgroupmembers: (state, action) => {
      const { formattedMembers, groupID } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (!group) return;

      formattedMembers.forEach(newMember => {
        const existing = group.members.find(m => m.GoogleID === newMember.GoogleID);
        if (!existing) {
          // New member: add directly
          group.members.push(newMember);
        } else if (existing.present === false) {
          // Previously removed member: reactivate and update info
          existing.present = true;
          existing.name = newMember.name;
          existing.imageURL = newMember.imageURL;
          existing.about = newMember.about;
        }
        // If already present and active, do nothing
      });
    },

    setgroupAdmin: (state, action) => {
      const { groupID, admins } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (!group) return;

      const existingIDs = new Set(group.groupAdmin.map(a => a.GoogleID));
      const newAdmins = admins.filter(a => !existingIDs.has(a.GoogleID));

      // Push new admin objects into groupAdmin
      group.groupAdmin.push(...newAdmins.map(a => ({ GoogleID: a.GoogleID })));
    },
    setmemberremoval: (state, action) => {
      const { groupID, removedmember } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (!group) return;

      if (removedmember === state.mygoogleID) {
        state.groupdata = state.groupdata.filter(g => g.groupID !== groupID);
        state.totalgroup = state.totalgroup.filter(g => g.groupID !== groupID);
      } else {
        if (group.members) {
          const member = group.members.find(member => member.GoogleID === removedmember);
          if (member) member.present = false;
        }
        const totalGroup = state.totalgroup.find(g => g.groupID === groupID);
        if (totalGroup && totalGroup.members) {
          totalGroup.members = totalGroup.members.filter(member => member.GoogleID !== removedmember);
        }
      }
    },
    settoken: (state, action) => {
      state.token = action.payload;
    },
    setgroupdescription: (state, action) => {
      const { groupID, description } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (group) {
        group.description = description;
      }
    },
    setdeletemessage: (state, action) => {
      const messagesToDelete = action.payload.deleted;

      if (!Array.isArray(messagesToDelete)) return;

      state.messages = state.messages.filter(msg => {
        return !messagesToDelete.some(
          delMsg => msg.timestamp === delMsg.timestamp && msg.from === delMsg.from && msg.to === delMsg.to
        );
      });
    },
    deletegroupmessage: (state, action) => {
      const { groupID, deleted } = action.payload;
      const group = state.groupdata.find(g => g.groupID === groupID);
      if (!group) return;

      group.groupMessages = group.groupMessages.filter(msg => {
        return !deleted.some(del => msg.timestamp === del.timestamp && msg.text === del.text && msg.from === del.from);
      });
    },
    deletegroupmsgbyadmin: (state, action) => {
      const { groupID, updated } = action.payload;

      // Find the group
      const group = state.groupdata.find(group => group.groupID === groupID);
      if (!group) return;

      // Update messages
      group.groupMessages.forEach(msg => {
        const shouldDelete = updated.some(
          del => del.timestamp === msg.timestamp && del.from === msg.from && groupID === msg.groupID
        );

        if (shouldDelete) {
          msg.text = 'Message deleted by admin';
          msg.messagetype = 'delete';
        }
      });
    },
  },
});

export const {
  setisgroupselected,
  setSelectedGoogleID,
  setChatData,
  setgroupdata,
  setaddpeople,
  addMessage,
  markAsRead,
  setonline,
  setmygoogleID,
  clearchat,
  removefriend,
  setmyprofileimage,
  setmyname,
  setwebTheme,
  setabout,
  setenterissend,
  pushonline,
  removeonline,
  setdelivered,
  setread,
  pushActive,
  removeActive,
  setmessagefromread,
  addTypingUser,
  removeTypingUser,
  setgroupmessagefromread,
  setaddgroup,
  addgroupmessage,
  setgroupdelivered,
  setaddgroupmembers,
  setgroupAdmin,
  setmemberremoval,
  settoken,
  addgrouptypingusers,
  removegrouptypingusers,
  setgroupdescription,
  setdeletemessage,
  deletegroupmessage,
  deletegroupmsgbyadmin,
} = selectedUserSlice.actions;

export default selectedUserSlice.reducer;
