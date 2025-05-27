const Chatdata = require("../../model/Chatdata");
const { userMap, socketToUser } = require("../helpers/socketMaps");

const addFriend = async (socket, io, { friendGoogleId, imageURL, name }) => {
  const fromGoogleId = socketToUser.get(socket.id);
  if (!fromGoogleId || !friendGoogleId) return;

  const userData = await Chatdata.findOne({ myGoogleID: fromGoogleId });
  const frienddata = await Chatdata.findOne({ myGoogleID: friendGoogleId });

  if (!userData || !frienddata) return;

  const alreadyFriend = userData.friends.some(
    (f) => f.GoogleID === friendGoogleId
  );
  if (alreadyFriend) return;

  userData.friends.push({ name, GoogleID: friendGoogleId, image: imageURL });
  frienddata.friends.push({
    name: userData.name,
    GoogleID: fromGoogleId,
    image: userData.image,
  });

  await Promise.all([userData.save(), frienddata.save()]);

  const friendsocketID = userMap.get(friendGoogleId);
  if (friendsocketID) {
    io.to(friendsocketID).emit("recieve-add-friend", {
      name: userData.name,
      image: userData.image,
      googleID: fromGoogleId,
    });
  }
};

module.exports = addFriend;
