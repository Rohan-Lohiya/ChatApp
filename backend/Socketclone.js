const Chatdata = require("./model/Chatdata");
const notifyUserOnline = require("./controller/notifyuseronline");
const notifyUserOffline = require("./controller/notifyuseroffline");

const userMap = new Map(); // userMap: Maps Google email -> socket.id
const socketToUser = new Map(); // socketToUser: Maps socket.id -> Google email
const joinedRooms = new Map(); // joinedRooms: Maps socket.id -> Set of room names (optional, for tracking rooms if needed)
const totalchatusers = new Map();
const Userwithfriends = new Map();

module.exports = function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    const cleanup = async () => {
      const userID = socketToUser.get(socket.id);

      if (userID) {
        notifyUserOffline(userID, userMap, io);

        userMap.delete(userID);
        socketToUser.delete(socket.id);
        joinedRooms.delete(socket.id);
        Userwithfriends.delete(userID);

        const sender = await Chatdata.findOne({ myGoogleID: userID });
        if (sender && sender.friends && sender.friends.length > 0) {
          for (const friend of sender.friends) {
            const friendDB = await Chatdata.findOne({
              myGoogleID: friend.GoogleID,
            });
            const friendsocketID = userMap.get(friend.GoogleID);
            if (friendDB) {
              friendDB.isActive = friendDB.isActive.filter(
                (f) => f.GoogleID !== userID
              );
              await friendDB.save();
            }

          }
        }

        console.log(`Cleaned up: ${socket.id} (${userID})`);
      }
    };

    socket.on("register-user", async ({ googleIdOrEmail, imageURL, name }) => {
      if (!googleIdOrEmail) return;

      const existingSocketId = userMap.get(googleIdOrEmail);
      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(`Replacing old connection for ${googleIdOrEmail}`);
        socketToUser.delete(existingSocketId);
        joinedRooms.delete(existingSocketId);
      }
      userMap.set(googleIdOrEmail, socket.id);
      socketToUser.set(socket.id, googleIdOrEmail);
      totalchatusers.set(googleIdOrEmail, {
        googleID: googleIdOrEmail,
        imageURL,
        name,
        socketID: socket.id,
      });

      const userData = await Chatdata.findOne({ myGoogleID: googleIdOrEmail });
      if (!userData) {
        const newUser = new Chatdata({
          myGoogleID: googleIdOrEmail,
          name: name,
          image: imageURL,
          friends: [],
          messages: [],
          onlineUsers: [],
          isActive: [],
        });
        await newUser.save();
      } else {
        userData.name = name;
        userData.image = imageURL;
        await userData.save();
      }

      await notifyUserOnline(googleIdOrEmail, userMap, io);
      socket.emit("registration-complete", { googleIdOrEmail });
      console.log("user registered", googleIdOrEmail);
    });

    socket.on("add-friend", async ({ friendGoogleId, imageURL, name }) => {
      const fromGoogleId = socketToUser.get(socket.id);
      if (!fromGoogleId || !friendGoogleId) return;
      console.log("add-friend", fromGoogleId, friendGoogleId);

      const userData = await Chatdata.findOne({ myGoogleID: fromGoogleId });
      const frienddata = await Chatdata.findOne({ myGoogleID: friendGoogleId });
      const friendsocketID = userMap.get(friendGoogleId);
      if (userData) {
        const alreadyFriend = userData.friends.some(
          (f) => f.GoogleID === friendGoogleId
        );
        if (!alreadyFriend) {
          userData.friends.push({
            name: name,
            GoogleID: friendGoogleId,
            image: imageURL,
          });
          await userData.save();

          frienddata.friends.push({
            name: userData.name,
            GoogleID: fromGoogleId,
            image: userData.image,
          });
          await frienddata.save();
          console.log(`👫 ${fromGoogleId} added ${friendGoogleId} as a friend`);
          if (friendsocketID) {
            console.log("recieve-add-friend socket emmitted");
            io.to(friendsocketID).emit("recieve-add-friend", {
              name: userData.name,
              image: userData.image,
              googleID: fromGoogleId,
            });
          }
        } else {
          console.log(
            `⚠️ ${friendGoogleId} is already a friend of ${fromGoogleId}`
          );
        }
      }
    });

    socket.on("send-to-user", async ({ userroom, message }) => {
      const fromGoogleId = socketToUser.get(socket.id);
      if (!fromGoogleId || !userroom || !message) return;

      const reciever = await Chatdata.findOne({ myGoogleID: userroom });
      const sender = await Chatdata.findOne({ myGoogleID: fromGoogleId });

      const recipientSocketId = userMap.get(userroom);

      // Add this console log
      console.log(
        "Attempting to send message to socket ID:",
        recipientSocketId
      );

      if (recipientSocketId) {
        console.log("found reciever", recipientSocketId);
        io.to(recipientSocketId).emit("receive-message", {
          from: fromGoogleId,
          to: userroom,
          text: message,
          delivered: true,
          read: false,
          timestamp: Date.now(),
        });
        sender.messages.push({
          from: fromGoogleId,
          to: userroom,
          text: message,
          delivered: true,
          read: false,
          timestamp: Date.now(),
        });
        sender.save();
        // Optionally: store the message in DB here for later retrieval
        if (reciever) {
          reciever.messages.push({
            from: fromGoogleId,
            to: userroom,
            text: message,
            delivered: true,
            read: false,
            timestamp: Date.now(),
          });
          reciever.save();
        }
        console.log(`📨 ${fromGoogleId} → ${userroom}: ${message}`);
        console.log(userMap);
      } else {
        // Add this console log
        console.log(
          `❌ ${userroom} is offline or not connected. Target userroom:`,
          userroom
        );

        if (reciever) {
          reciever.messages.push({
            from: fromGoogleId,
            to: userroom,
            text: message,
            delivered: false,
            read: false,
            timestamp: Date.now(),
          });
          reciever.save();
        }
        sender.messages.push({
          from: fromGoogleId,
          to: userroom,
          text: message,
          delivered: false,
          read: false,
          timestamp: Date.now(),
        });
        sender.save();
      }
    });

    socket.on("mark-as-read", async (selectedGoogleID) => {
      console.log("mark-as-read", selectedGoogleID);
    
      const senderGoogleID = socketToUser.get(socket.id);
      if (!senderGoogleID || !selectedGoogleID) return;
    
      const recieverSocketID = userMap.get(selectedGoogleID);
      const sender = await Chatdata.findOne({ myGoogleID: senderGoogleID });
      const receiver = await Chatdata.findOne({ myGoogleID: selectedGoogleID });
    
      if (!sender || !receiver) return;
    
      // ✅ Mark messages as read in receiver's messages
      let receiverUpdated = false;
      receiver.messages.forEach((message) => {
        if (message.from === senderGoogleID && message.to === selectedGoogleID && !message.read) {
          message.read = true;
          receiverUpdated = true;
        }
      });
      if (receiverUpdated) await receiver.save();
    
      // ✅ Mark messages as read in sender's messages
      let senderUpdated = false;
      sender.messages.forEach((message) => {
        if (message.from === senderGoogleID && message.to === selectedGoogleID && !message.read) {
          message.read = true;
          senderUpdated = true;
        }
      });
      if (senderUpdated) await sender.save();
    
      // ✅ Update active state for sender in friends' lists
      Userwithfriends.set(senderGoogleID, selectedGoogleID);
    
      for (const friend of sender.friends) {
        const friendDB = await Chatdata.findOne({ myGoogleID: friend.GoogleID });
        if (!friendDB) continue;
    
        if (friend.GoogleID === selectedGoogleID) {
          const alreadyExists = friendDB.isActive.some(
            (f) => f.GoogleID === senderGoogleID
          );
          if (!alreadyExists) {
            friendDB.isActive.push({ GoogleID: senderGoogleID });
          }
    
          // ✅ Emit message-read only to selectedGoogleID
          if (recieverSocketID) {
            io.to(recieverSocketID).emit("message-read", {
              GoogleID: senderGoogleID,
            });
          }
        } else {
          const originalLength = friendDB.isActive.length;
          friendDB.isActive = friendDB.isActive.filter(
            (f) => f.GoogleID !== senderGoogleID
          );
    
          // ✅ Only emit not-active if removal happened
          if (friendDB.isActive.length !== originalLength) {
            const friendSocketID = userMap.get(friend.GoogleID);
            if (friendSocketID) {
              io.to(friendSocketID).emit("not-active", {
                GoogleID: senderGoogleID,
              });
            }
          }
        }
    
        await friendDB.save();
      }
    });
    

    socket.on("disconnect", cleanup);
  });
};
