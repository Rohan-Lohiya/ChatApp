const Chatdata = require("../model/Chatdata");
const Groupdata = require("../model/Groupdata");

async function notifyUserOnline(googleID, userMap, io) {
  try {
    // Fetch user data from DB
    const user = await Chatdata.findOne({ myGoogleID: googleID });
    const groupIDs = user.totalgroup.map((g) => g.groupID);

    if (user && user.friends) {
      const { name, friends } = user;

      // Update delivered attribute in user's messages
      user.messages.forEach((message) => {
        if (!message.delivered) {
          message.delivered = true;
        }
      });
      await user.save();

      for (const friend of friends) {
        const friendGoogleID = friend.GoogleID;
        const socketId = userMap.get(friendGoogleID);
        const frienddata = await Chatdata.findOne({
          myGoogleID: friendGoogleID,
        });

        // Notify friend if they are online
        if (socketId) {
          io.to(socketId).emit("user-online", {
            GoogleID: googleID, // Changed to uppercase G
            name: name,
          });
        }

        // Update delivered attribute in friend's messages
        frienddata.messages.forEach((message) => {
          if (message.receiverGoogleID === googleID && !message.delivered) {
            message.delivered = true;
          }
        });
        await frienddata.save();

        // Check if user is already in friend's onlineUsers list
        const isAlreadyOnline = frienddata.onlineUsers.some(
          (onlineUser) => onlineUser.GoogleID === googleID
        );

        if (!isAlreadyOnline) {
          frienddata.onlineUsers.push({
            name: name,
            GoogleID: googleID,
          });
          await frienddata.save();
        }
      }

      for(const groupID of groupIDs){
        const group = await Groupdata.findOne({groupID: groupID});
        if(group){
            io.to(groupID).emit("group-user-online", {GoogleID: googleID, groupID: groupID});
            group.groupMessages.forEach((msg) => {
            if (!msg.deliveredTo.includes(googleID)) {
              msg.deliveredTo.push(googleID);
            }
            if (
              group.members.length === msg.deliveredTo.length &&
              !msg.delivered
            ) {
              msg.delivered = true;
            }
            });
            await group.save();
        }
        else{
          console.log("group not found", groupID);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error notifying online status:", err.message);
  }
}

module.exports = notifyUserOnline;
