const Groupdata = require("../../model/Groupdata");
const Chatdata = require("../../model/Chatdata");
const { userMap, socketToUser, Userwithfriends } = require("../helpers/socketMaps");

const MAX_RETRIES = 3;

const applyReadUpdates = (group, senderGoogleID) => {
  const presentMemberCount = group.members.filter((m) => m.present).length;

  let groupChanged = false;
  const unreadMessages = group.groupMessages.filter((msg) => !msg.readBy.includes(senderGoogleID));

  for (const msg of unreadMessages) {
    msg.readBy.push(senderGoogleID);
    msg.readBy = [...new Set(msg.readBy)]; // Avoid duplicate GoogleIDs
    msg.read = msg.readBy.length === presentMemberCount;
    groupChanged = true;
  }

  return groupChanged;
};

const groupMarkAsRead = async (socket, io, selectedGoogleID) => {
  console.log("group mark as read occurred");
  const senderGoogleID = socketToUser.get(socket.id);
  if (!senderGoogleID || !selectedGoogleID) return;

  // Store currently opened group chat
  Userwithfriends.set(senderGoogleID, selectedGoogleID);

  let group = await Groupdata.findOne({ groupID: selectedGoogleID });
  const user = await Chatdata.findOne({ myGoogleID: senderGoogleID });

  if (!group || !user) {
    console.log("Group or User not found in groupMarkAsRead");
    return;
  }

  let retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    try {
      const groupChanged = applyReadUpdates(group, senderGoogleID);

      if (groupChanged) {
        await group.save();

        io.to(group.groupID).emit("group-message-read", {
          GoogleID: senderGoogleID,
          groupID: selectedGoogleID,
        });
      }
      break; // success
    } catch (err) {
      if (err.name === "VersionError") {
        retryCount++;
        console.warn(`VersionError on group.save(), retrying (${retryCount}/${MAX_RETRIES})`);
        group = await Groupdata.findOne({ groupID: selectedGoogleID });
        if (!group) {
          console.log("Group disappeared on retry in groupMarkAsRead");
          return;
        }
      } else {
        throw err; // unknown error, rethrow
      }
    }
  }

  // Process friends' active status
  const friendGoogleIDs = user.friends.map((f) => f.GoogleID);

  for (const friendGoogleID of friendGoogleIDs) {
    if (friendGoogleID === selectedGoogleID) continue;

    const friendDB = await Chatdata.findOne({ myGoogleID: friendGoogleID });
    if (!friendDB) continue;

    const wasActive = friendDB.isActive.some((f) => f.GoogleID === senderGoogleID);

    // Remove sender from friend's isActive list
    friendDB.isActive = friendDB.isActive.filter((f) => f.GoogleID !== senderGoogleID);

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
