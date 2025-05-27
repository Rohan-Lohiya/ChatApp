const Groupdata = require("../../model/Groupdata");
const {
  userMap,
  socketToUser,
  Userwithfriends,
} = require("../helpers/socketMaps");

const sendGroupMessage = async (socket, io, { groupID, message }) => {
  console.log("sendgroupmessage event occurs: ", groupID, message);

  const fromGoogleId = socketToUser.get(socket.id);
  if (!fromGoogleId || !groupID || !message) return;

  const group = await Groupdata.findOne({ groupID });
  if (!group) {
    console.log("Group not found in sendGroupMessage");
    return;
  }

  // Check if sender is a valid member and present
  const senderIsMember = group.members.some(
    (m) => m.GoogleID === fromGoogleId && m.present
  );
  if (!senderIsMember) {
    console.log("Sender is not a member of the group");
    return;
  }

  // Compute delivery status
  const deliveredTo = group.members
    .filter((member) => member.present && userMap.has(member.GoogleID))
    .map((member) => member.GoogleID);

  const readBy = group.members
    .filter(
      (member) =>
        member.present && Userwithfriends.get(member.GoogleID) === groupID
    )
    .map((member) => member.GoogleID);

  const messagedata = {
    from: fromGoogleId,
    groupID,
    text: message,
    timestamp: Date.now(),
    delivered:
      deliveredTo.length === group.members.filter((m) => m.present).length,
    deliveredTo,
    readBy,
    read: readBy.length === group.members.filter((m) => m.present).length,
    messagetype: "text",
  };

  group.groupMessages.push(messagedata);
  await group.save();

  io.to(groupID).emit("receive-groupmessage", messagedata);
};

module.exports = sendGroupMessage;
