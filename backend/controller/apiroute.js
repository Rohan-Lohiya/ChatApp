const express = require("express");
const router = express.Router();
const Chatdata = require("../model/Chatdata");
const Groupdata = require("../model/Groupdata");
const authenticateToken = require("./authenticatetoken");

router.post("/check-user", async (req, res) => {
  const { googleID } = req.body;
  if (!googleID) return res.status(400).json({ error: "Missing Google ID" });

  try {
    const user = await Chatdata.findOne({ myGoogleID: googleID });

    if (user) {
      return res.status(200).json({
        exists: true,
        user: {
          googleID: user.myGoogleID,
          name: user.name,
          image: user.image,
        },
      });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// In apiroute.js
router.post("/get-chat-data", authenticateToken, async (req, res) => {
  const googleID = req.user.email;

  if (!googleID) {
    return res.status(400).json({ error: "Missing Google ID" });
  }

  try {
    const chatData = await Chatdata.findOne({ myGoogleID: googleID });

    if (!chatData) {
      return res.status(404).json({ error: "Chat data not found" });
    }

    const groupdata = [];

    for (const group of chatData.totalgroup) {
      if (group.groupID) {
        const usergroup = await Groupdata.findOne({ groupID: group.groupID });
        if (usergroup) groupdata.push(usergroup);
      }
    }

    return res.status(200).json({
      chatData,
      groupdata,
    });
  } catch (error) {
    console.error("Error fetching chat data:", error);
    return res.status(500).json({ error: "Server error" });
  }
});
router.post("/change-about", authenticateToken, async (req, res) => {
  const {about} = req.body;
  const googleID = req.user.email;
  if (!about || !googleID) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const user = await Chatdata.findOne({ myGoogleID: googleID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Update the user's about information
    user.about = about;
    await user.save();
    // Update the about information in all groups where the user is a member
    const groups = user.totalgroup;
    for (const group of groups) {
      if(group.groupID){
        const groupdata = await Groupdata.findOne({groupID: group.groupID});
        if (groupdata) {
          const member = groupdata.members.find(member => member.GoogleID === googleID);
          if (member) {
            member.about = about; // Update the about field
            await groupdata.save(); // Save the updated group data
          }
        }
      }
    }
    // update the about information in all friends
    const friends = user.friends;
    for (const friend of friends) {
      if (friend.GoogleID) {
        const friendData = await Chatdata.findOne({ myGoogleID: friend.GoogleID });
        if (friendData) {
          const friendMember = friendData.friends.find(f => f.GoogleID === googleID);
          if (friendMember) {
            friendMember.about = about; // Update the about field
            await friendData.save(); // Save the updated friend data
          }
        }
      }
    }
    return res.status(200).json({ message: "About updated successfully" });
  } catch (error) {
    console.error("Error updating about:", error);
    return res.status(500).json({ error: "Server error" });
    
  }
});

module.exports = { router };
