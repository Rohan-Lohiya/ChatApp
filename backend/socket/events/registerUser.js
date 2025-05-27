const Chatdata = require("../../model/Chatdata");
const notifyUserOnline = require("../../controller/notifyuseronline");
const {
  userMap,
  socketToUser,
  totalchatusers,
} = require("../helpers/socketMaps");

const registerUser = async (
  socket,
  io,
  { googleIdOrEmail, imageURL, name }
) => {
  if (!googleIdOrEmail) return;

  const existingSocketId = userMap.get(googleIdOrEmail);
  if (existingSocketId && existingSocketId !== socket.id) {
    socketToUser.delete(existingSocketId);
  }

  userMap.set(googleIdOrEmail, socket.id);
  socketToUser.set(socket.id, googleIdOrEmail);
  totalchatusers.set(googleIdOrEmail, {
    googleID: googleIdOrEmail,
    imageURL,
    name,
    socketID: socket.id,
  });

  let userData = await Chatdata.findOne({ myGoogleID: googleIdOrEmail });
  if (!userData) {
    userData = new Chatdata({
      myGoogleID: googleIdOrEmail,
      name,
      image: imageURL,
      friends: [],
      messages: [],
      onlineUsers: [],
      isActive: [],
      totalgroup: [],
    });
  } else {
    userData.name = name;
    userData.image = imageURL;
  }
  await userData.save();

  if (userData && userData.totalgroup) {
    for (const group of userData.totalgroup) {
      if (group.groupID) {
        socket.join(group.groupID);
        console.log(
        `User ${googleIdOrEmail} socket ${socket.id} joined group ${group.groupID}`
      );
      }
      
    }
  }

  await notifyUserOnline(googleIdOrEmail, userMap, io);
  socket.emit("registration-complete", { googleIdOrEmail });
};

module.exports = registerUser;
