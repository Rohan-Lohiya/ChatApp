const Groupdata = require("../../model/Groupdata");
const Chatdata = require("../../model/Chatdata");
const {
  userMap,
  socketToUser,
  Userwithfriends,
} = require("../helpers/socketMaps");

const groupMarkAsRead = async (socket, io, selectedGoogleID) => {
  console.log("group mark as read occurec");
  const senderGoogleID = socketToUser.get(socket.id);
  if (!senderGoogleID || !selectedGoogleID) return;

  // Store currently opened group chat
  Userwithfriends.set(senderGoogleID, selectedGoogleID);

  const group = await Groupdata.findOne({ groupID: selectedGoogleID });
  const user = await Chatdata.findOne({ myGoogleID: senderGoogleID });

  if (!group || !user){
    console.log("Group or User not fouund group mark as read");
     return};

  let groupChanged = false;
  const presentMemberCount = group.members.filter(m => m.present).length;

  const unreadMessages = group.groupMessages.filter(
    (msg) => !msg.readBy.includes(senderGoogleID)
  );

  for (const msg of unreadMessages) {
    msg.readBy.push(senderGoogleID);
    msg.readBy = [...new Set(msg.readBy)]; // Avoid duplicate GoogleIDs
    msg.read = msg.readBy.length === presentMemberCount;
    groupChanged = true;
  }

  if (groupChanged) {
    await group.save();
    io.to(group.groupID).emit("group-message-read", {
      GoogleID: senderGoogleID,
      groupID: selectedGoogleID,
    });
  }

  const friendGoogleIDs = user.friends.map(f => f.GoogleID);

  for (const friendGoogleID of friendGoogleIDs) {
    if (friendGoogleID === selectedGoogleID) continue;

    const friendDB = await Chatdata.findOne({ myGoogleID: friendGoogleID });
    if (!friendDB) continue;

    const wasActive = friendDB.isActive.some(
      (f) => f.GoogleID === senderGoogleID
    );

    // Remove sender from friend's isActive list
    friendDB.isActive = friendDB.isActive.filter(
      (f) => f.GoogleID !== senderGoogleID
    );

    if (wasActive) {
      const friendSocketID = userMap.get(friendGoogleID);
      if (friendSocketID) {
        io.to(friendSocketID).emit("not-active", {
          GoogleID: senderGoogleID,
        });
      }
      await friendDB.save();
    }
  }
};

module.exports = groupMarkAsRead;
