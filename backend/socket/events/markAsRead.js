const Chatdata = require("../../model/Chatdata");
const { userMap, socketToUser, Userwithfriends } = require("../helpers/socketMaps");

const markAsRead = async (socket, io, selectedGoogleID) => {
  
  const senderGoogleID = socketToUser.get(socket.id);
  Userwithfriends.set(senderGoogleID, selectedGoogleID); // Store the selectedGoogleID for the sender
  if (!senderGoogleID || !selectedGoogleID) return;

  const [sender, receiver] = await Promise.all([
    Chatdata.findOne({ myGoogleID: senderGoogleID }),
    Chatdata.findOne({ myGoogleID: selectedGoogleID }),
  ]);

  if (!sender || !receiver) return;

  let senderChanged = false,
    receiverChanged = false;

  sender.messages.forEach((msg) => {
    if (
      msg.from === selectedGoogleID &&
      msg.to === senderGoogleID &&
      !msg.read
    ) {
      msg.read = true;
      senderChanged = true;
    }
  });

  receiver.messages.forEach((msg) => {
    if (
      msg.from === senderGoogleID &&
      msg.to === selectedGoogleID &&
      !msg.read
    ) {
      msg.read = true;
      receiverChanged = true;
    }
  });

  await Promise.all([
    senderChanged ? sender.save() : null,
    receiverChanged ? receiver.save() : null,
  ]);

  const friendGoogleIDs = sender.friends.map((f) => f.GoogleID);

  // ✅ Add senderGoogleID to selectedGoogleID's isActive if not exists
  await Chatdata.updateOne(
    {
      myGoogleID: selectedGoogleID,
      "isActive.GoogleID": { $ne: senderGoogleID },
    },
    { $push: { isActive: { GoogleID: senderGoogleID } } }
  );

  // ✅ Handle other friends
  for (const friendGoogleID of friendGoogleIDs) {
    if (friendGoogleID === selectedGoogleID) continue;

    const friendDB = await Chatdata.findOne({ myGoogleID: friendGoogleID });
    if (!friendDB) continue;

    const originalLength = friendDB.isActive.length;

    // ✅ Remove senderGoogleID from friend's isActive array
    friendDB.isActive = friendDB.isActive.filter(
      (f) => f.GoogleID !== senderGoogleID
    );

    if (friendDB.isActive.length !== originalLength) {
      // ✅ Emit not-active to friend if removal happened
      const friendSocketID = userMap.get(friendGoogleID);
      if (friendSocketID) {
        io.to(friendSocketID).emit("not-active", {
          GoogleID: senderGoogleID,
        });
      }
    }

    await friendDB.save();
  }

  // ✅ Emit message-read to selectedGoogleID if online
  const recieverSocketID = userMap.get(selectedGoogleID);
  if (recieverSocketID) {
    io.to(recieverSocketID).emit("message-read", { GoogleID: senderGoogleID });
  }
};

module.exports = markAsRead;
