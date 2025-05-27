const Chatdata = require("../../model/Chatdata");
const Groupdata = require("../../model/Groupdata");
const notifyUserOffline = require("../../controller/notifyuseroffline");
const { userMap, socketToUser, joinedRooms, Userwithfriends } = require("../helpers/socketMaps");

const handleDisconnect = async (socket, io) => {
  const userID = socketToUser.get(socket.id);
  if (!userID) return;

  notifyUserOffline(userID, userMap, io);

  const userData = await Chatdata.findOne({ myGoogleID: userID });
  if (userData && userData.friends.length > 0) {
    const friendGoogleIDs = userData.friends.map(f => f.GoogleID);
    await Chatdata.updateMany(
      { myGoogleID: { $in: friendGoogleIDs } },
      { $pull: { isActive: { GoogleID: userID } } }
    );
  }
  userMap.delete(userID);
  socketToUser.delete(socket.id);
  joinedRooms.delete(socket.id);
  Userwithfriends.delete(userID);
};

module.exports = handleDisconnect;
