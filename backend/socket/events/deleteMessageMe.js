const Chatdata = require("../../model/Chatdata");
const { userMap, socketToUser, Userwithfriends } = require("../helpers/socketMaps");

const deleteMessageMe = async (socket, io, data) => {
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

    if (!userChat) {
      console.error("No chat data found for user:", fromGoogleId);
      return;
    }

    const messagesToDelete = new Set(data.map((msg) => `${msg.timestamp}|${msg.from}|${msg.to}`));

    userChat.messages = userChat.messages.filter((msg) => {
      const msgKey = `${msg.timestamp.toISOString()}|${msg.from}|${msg.to}`;
      return !messagesToDelete.has(msgKey);
    });

    await userChat.save();

    socket.emit("messagesDeletedMe", {
      deleted: data.map((msg) => ({
        timestamp: msg.timestamp,
        from: msg.from,
        to: msg.to,
      })),
    });
  } catch (error) {
    console.error("Error deleting messages for me:", error);
  }
};

module.exports = deleteMessageMe;
