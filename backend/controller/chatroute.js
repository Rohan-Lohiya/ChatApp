const express = require("express");
const router = express.Router();
const Chatdata = require("../model/Chatdata");
const Groupdata = require("../model/Groupdata");
const { v4: uuidv4 } = require("uuid");
const { userMap } = require("../socket/helpers/socketMaps");
const authenticateToken = require("./authenticatetoken");
const { getIo } = require("../socket/io");


router.post("/clear-chat", authenticateToken, async (req, res) => {
    const io = getIo();
  const senderGoogleID = req.user.email;
  const { todeleteUserID } = req.body;

  if (!senderGoogleID || !todeleteUserID) {
    console.log("Missing fields in clear chat request");
    return res.status(400).json({ error: "Required fields are missing" });
  }

  try {
    const senderdata = await Chatdata.findOne({ myGoogleID: senderGoogleID });

    if (!senderdata) {
      return res.status(404).json({ error: "Chat data not found for sender" });
    }

    // Filter out messages between the sender and the to-delete user
    senderdata.messages = senderdata.messages.filter(
      (msg) =>
        !(
          (msg.from === todeleteUserID && msg.to === senderGoogleID) ||
          (msg.to === todeleteUserID && msg.from === senderGoogleID)
        )
    );

    await senderdata.save();

    return res
      .status(200)
      .json({ message: "Chat messages cleared successfully" });
  } catch (error) {
    console.error("Error clearing chat:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/delete-chat", authenticateToken, async (req, res) => {
  const io = getIo();
  const senderGoogleID = req.user.email;
  const { todeleteUserID } = req.body;

  if (!senderGoogleID || !todeleteUserID) {
    console.log("Missing fields in delete chat request");
    return res.status(400).json({ error: "Required fields are missing" });
  }

  try {
    const senderdata = await Chatdata.findOne({ myGoogleID: senderGoogleID });
    const deleteuserdata = await Chatdata.findOne({ myGoogleID: todeleteUserID });

    if (!senderdata || !deleteuserdata) {
      return res.status(404).json({ error: "Chat data not found for sender or receiver" });
    }

    // Remove each other from friends list
    senderdata.friends = senderdata.friends.filter(
      (friend) => friend.GoogleID !== todeleteUserID
    );
    deleteuserdata.friends = deleteuserdata.friends.filter(
      (friend) => friend.GoogleID !== senderGoogleID
    );

    // Remove messages exchanged between the two
    senderdata.messages = senderdata.messages.filter(
      (msg) =>
        !(
          (msg.from === todeleteUserID && msg.to === senderGoogleID) ||
          (msg.to === todeleteUserID && msg.from === senderGoogleID)
        )
    );

    deleteuserdata.messages = deleteuserdata.messages.filter(
      (msg) =>
        !(
          (msg.from === senderGoogleID && msg.to === todeleteUserID) ||
          (msg.to === senderGoogleID && msg.from === todeleteUserID)
        )
    );

    await senderdata.save();
    await deleteuserdata.save();

    // Notify the deleted user via socket
    const socketID = userMap.get(todeleteUserID);
    if (socketID) {
      io.to(socketID).emit("deletefriend", senderGoogleID);
    }

    return res.status(200).json({ success: true, message: "Chat deleted successfully." });

  } catch (error) {
    console.error("Error in /delete-chat:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = { router };
