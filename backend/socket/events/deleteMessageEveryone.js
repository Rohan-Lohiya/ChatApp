const Chatdata = require("../../model/Chatdata");
const { userMap, socketToUser, Userwithfriends } = require("../helpers/socketMaps");

const deleteMessageEveryone = async (socket, io, { data, to }) => {
  const fromGoogleId = socketToUser.get(socket.id);

  if (!fromGoogleId) {
    console.error("Invalid socket ID: User not found");
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid data: Must be a non-empty array of message objects");
    return;
  }

  try {
    const userChat = await Chatdata.findOne({ myGoogleID: fromGoogleId });
    const touserChat = await Chatdata.findOne({ myGoogleID: to });

    if (!userChat || !touserChat) {
      console.error("No chat data found for user:", fromGoogleId, to);
      return;
    }

    const messagesToDelete = new Set(data.map((msg) => `${msg.timestamp}|${msg.from}|${msg.to}`));

    userChat.messages = userChat.messages.filter((msg) => {
      const msgKey = `${msg.timestamp.toISOString()}|${msg.from}|${msg.to}`;
      return !messagesToDelete.has(msgKey);
    });
    touserChat.messages = touserChat.messages.filter((msg) => {
      const msgKey = `${msg.timestamp.toISOString()}|${msg.from}|${msg.to}`;
      return !messagesToDelete.has(msgKey);
    });

    await userChat.save();
    await touserChat.save();

    socket.emit("messagesDeletedEveryone", {
      deleted: data.map((msg) => ({
        timestamp: msg.timestamp,
        from: msg.from,
        to: msg.to,
      })),
    });
    const tousersocketID = userMap.get(to);
    if (tousersocketID) {
      io.to(tousersocketID).emit("messagesDeletedEveryone", {
        deleted: data.map((msg) => ({
          timestamp: msg.timestamp,
          from: msg.from,
          to: msg.to,
        })),
      });
    }
  } catch (error) {
    console.error("Error deleting messages for me:", error);
  }
};
module.exports = deleteMessageEveryone;
