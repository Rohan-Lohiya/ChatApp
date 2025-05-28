const Groupdata = require("../../model/Groupdata");
const { socketToUser, userMap } = require("../helpers/socketMaps");

const deleteGroupMessage = async (socket, io, { data, groupID }) => {
  const fromGoogleId = socketToUser.get(socket.id);

  if (!fromGoogleId || !data || !Array.isArray(data) || !groupID) {
    console.log("Invalid delete group message request");
    return;
  }

  try {
    const groupdata = await Groupdata.findOne({ groupID });
    if (!groupdata) {
      console.log("Group not found:", groupID);
      return;
    }

    const beforeCount = groupdata.groupMessages.length;
    groupdata.groupMessages = groupdata.groupMessages.filter((msg) => {
      return !data.some(
        (deleteMsg) =>
          msg.timestamp.getTime() === new Date(deleteMsg.timestamp).getTime() &&
          msg.from === deleteMsg.from &&
          msg.text === deleteMsg.text
      );
    });

    const afterCount = groupdata.groupMessages.length;

    await groupdata.save();

    const deletedMessages = beforeCount - afterCount;
    console.log(`Deleted ${deletedMessages} group messages for everyone in group ${groupID}`);

    io.to(groupID).emit("groupMessagesDeleted", {
      groupID,
      deleted: data,
    });
  } catch (error) {
    console.error("Error deleting group messages for everyone:", error);
  }
};

module.exports = deleteGroupMessage;
