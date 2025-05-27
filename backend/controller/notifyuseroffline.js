const Chatdata = require("../model/Chatdata");


async function notifyUserOffline(googleID, userMap, io) {
    try {
      // Fetch user data from DB
      const user = await Chatdata.findOne({ myGoogleID: googleID });
  
      if (user && user.friends) {
        const { name, friends } = user;
  
        for (const friend of friends) {
          const friendGoogleID = friend.GoogleID;
          const socketId = userMap.get(friendGoogleID);
          const frienddata = await Chatdata.findOne({ myGoogleID: friendGoogleID });
  
          if (socketId) {
            io.to(socketId).emit("user-offline", {
              GoogleID: googleID,  // Changed to uppercase G
              name: name,
            });
          }
          const isAlreadyOnline = frienddata.onlineUsers.some(
            (onlineUser) => onlineUser.GoogleID === googleID
          );
          
          if (isAlreadyOnline) {
            frienddata.onlineUsers = frienddata.onlineUsers.filter(
              (onlineUser) => onlineUser.GoogleID !== googleID
            );
            await frienddata.save();
          }
          
        }
      }
    } catch (err) {
      console.error("❌ Error notifying online status:", err.message);
    }
  }
  module.exports = notifyUserOffline;