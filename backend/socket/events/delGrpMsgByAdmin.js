const Groupdata = require("../../model/Groupdata");
const { socketToUser, userMap } = require("../helpers/socketMaps");

const delGrpMsgByAdmin = async (socket, io, { data, groupID }) => {
  const fromGoogleId = socketToUser.get(socket.id);

  if (!fromGoogleId || !data || !Array.isArray(data) || !groupID) {
    console.log("Invalid delete group message request");
    return;
  }

  try {
    const group = await Groupdata.findOne({ groupID });

    if (!group) {
      socket.emit("error", { message: "Group not found." });
      return;
    }

    const isAdmin = group.groupAdmin.some((admin) => admin.GoogleID === fromGoogleId);

    if (!isAdmin) {
      socket.emit("error", { message: "You are not authorized to delete group messages." });
      return;
    }

    let updatedMessages = [];

    data.forEach((chat) => {
      const msg = group.groupMessages.find(
        (m) =>
          m.timestamp.getTime() === new Date(chat.timestamp).getTime() && m.from === chat.from && m.text === chat.text
      );

      if (msg) {
        msg.text = "Message deleted by admin";
        msg.messagetype = "delete";
        updatedMessages.push({
          timestamp: msg.timestamp,
          from: msg.from,
          text: msg.text,
          messagetype: msg.messagetype,
        });
      }
    });

    await group.save();

    if (updatedMessages.length > 0) {
      io.to(groupID).emit("groupMessagesDeletedByAdmin", {
        groupID,
        updated: updatedMessages,
      });
    }
  } catch (error) {
    console.error("Error deleting group messages by admin:", error);
    socket.emit("error", { message: "Server error during deletion." });
  }
};

module.exports = delGrpMsgByAdmin;
