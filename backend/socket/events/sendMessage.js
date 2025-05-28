const Chatdata = require("../../model/Chatdata");
const { userMap, socketToUser, Userwithfriends } = require("../helpers/socketMaps");

const sendMessage = async (socket, io, { userroom, message }) => {
  const fromGoogleId = socketToUser.get(socket.id);
  if (!fromGoogleId || !userroom || !message) return;
  const currentActiveChat = Userwithfriends.get(userroom);
  const isActive = currentActiveChat === fromGoogleId;
  console.log(fromGoogleId, " is active with ", userroom, ":", isActive);

  const [receiver, sender] = await Promise.all([
    Chatdata.findOne({ myGoogleID: userroom }),
    Chatdata.findOne({ myGoogleID: fromGoogleId }),
  ]);

  if (!sender || !receiver) return;

  const recipientSocketId = userMap.get(userroom);
  const messageData = {
    from: fromGoogleId,
    to: userroom,
    text: message,
    delivered: !!recipientSocketId,
    read: isActive,
    timestamp: Date.now(),
  };

  sender.messages.push(messageData);
  receiver.messages.push(messageData);

  await Promise.all([sender.save(), receiver.save()]);

  if (recipientSocketId) {
    io.to(recipientSocketId).emit("receive-message", messageData);
  }
  io.to(socket.id).emit("receive-message", messageData);
};

module.exports = sendMessage;
