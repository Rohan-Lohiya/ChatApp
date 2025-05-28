const registerUser = require("./events/registerUser");
const addFriend = require("./events/addFriend");
const sendMessage = require("./events/sendMessage");
const markAsRead = require("./events/markAsRead");
const handleDisconnect = require("./events/disconnect");
const sendGroupMessage = require("./events/sendGroupMessage");
const groupMarkAsRead = require("./events/groupMarkAsRead");
const deleteMessageMe = require("./events/deleteMessageMe");
const deleteMessageEveryone = require("./events/deleteMessageEveryone");
const { userMap } = require("./helpers/socketMaps");

module.exports = function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("register-user", (data) => registerUser(socket, io, data));
    socket.on("add-friend", (data) => addFriend(socket, io, data));
    socket.on("send-to-user", (data) => sendMessage(socket, io, data));
    socket.on("mark-as-read", (data) => markAsRead(socket, io, data));
    socket.on("disconnect", () => handleDisconnect(socket, io));
    socket.on("send-to-group", (data) => sendGroupMessage(socket, io, data));
    socket.on("typing", ({ to, from }) => {
      io.to(userMap.get(to)).emit("usertyping", { from });
      console.log("typing", { to, from });
    });

    socket.on("stopTyping", ({ to, from }) => {
      io.to(userMap.get(to)).emit("userstopTyping", { from });
    });
    socket.on("groupTyping", ({ to, from }) => {
      io.to(to).emit("groupusertyping", { groupID: to, GoogleID: from });
    });

    socket.on("groupStopTyping", ({ to, from }) => {
      io.to(to).emit("groupuserstopTyping", { groupID: to, GoogleID: from });
    });
    socket.on("group-mark-as-read", (data) => groupMarkAsRead(socket, io, data));
    socket.on("delete-message-me", (data) => deleteMessageMe(socket, io, data));
    socket.on("delete-message-everyone", ({ data, to }) => deleteMessageEveryone(socket, io, { data, to }));
  });
};
