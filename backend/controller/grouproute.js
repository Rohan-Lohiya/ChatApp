const express = require("express");
const router = express.Router();
const Chatdata = require("../model/Chatdata");
const Groupdata = require("../model/Groupdata");
const { v4: uuidv4 } = require("uuid");
const { userMap } = require("../socket/helpers/socketMaps");
const authenticateToken = require("./authenticatetoken");
const { getIo } = require("../socket/io");

// Import io properly - make sure your server exports it correctly

router.post("/creategroup", async (req, res) => {
  const io = getIo();
  console.log("create group occurs");
  const { groupName, groupImage, members, groupAdmin, description } = req.body;

  try {
    if (!groupName || !members || !groupAdmin) {
      return res.status(400).json({
        error: "Missing required fields (groupName, members, groupAdmin)",
      });
    }

    const groupID = uuidv4();

    const formattedMembers = members.map((member) => ({
      GoogleID: member.GoogleID,
      imageURL: member.imageURL || null,
      name: member.name || null,
      about: member.about || null,
      present: true,
    }));

    const formattedAdmins = groupAdmin.map((admin) => ({
      GoogleID: admin.GoogleID,
      imageURL: admin.imageURL || null,
    }));

    const newGroup = {
      groupName: groupName,
      groupImage: groupImage,
      members: formattedMembers,
      groupAdmin: formattedAdmins,
      description: description || null,
      groupID: groupID,
    };
    const newgroupforuser = {
      groupID: groupID,
      members: formattedMembers,
    };

    const groupdata = new Groupdata({
      ...newGroup,
      groupMessages: [],
    });
    const senderGoogleID = formattedAdmins[0]?.GoogleID;

    const message = {
      from: senderGoogleID,
      groupID,
      text: `${senderGoogleID} Created group`,
      timestamp: new Date(),
      delivered: false,
      deliveredTo: [],
      readBy: [],
      read: false,
      messagetype: "notification",
    };
    groupdata.groupMessages.push(message);

    await groupdata.save();

    for (const member of members) {
      const user = await Chatdata.findOne({ myGoogleID: member.GoogleID });
      if (!user) {
        return res.status(404).json({ message: `User with GoogleID ${member.GoogleID} not found` });
      }
      user.totalgroup.push(newgroupforuser);
      await user.save();

      // Safe socket handling
      if (io && userMap) {
        const socketId = userMap.get(member.GoogleID);
        if (socketId) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.join(groupID);
            console.log(`Socket ${socketId} joined group room ${groupID}`);
          }
        }
      }
    }
    if (io) {
      io.to(groupID).emit("newgroupjoined", groupdata);
    }

    res.status(201).json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/add-member", authenticateToken, async (req, res) => {
  const io = getIo();
  console.log("add member occured");
  const { groupID, members } = req.body;
  const senderGoogleID = req.user.email;
  try {
    if (!groupID || !members || !senderGoogleID) {
      return res.status(400).json({
        error: "Missing required fields (groupID, members, senderGoogleID)",
      });
    }
    const groupdata = await Groupdata.findOne({ groupID: groupID });
    if (!groupdata || !groupdata.groupAdmin.some((admin) => admin.GoogleID === senderGoogleID)) {
      return res.status(403).json({
        message: "You are not authorized to add members to this group",
      });
    }

    const formattedMembers = members.map((member) => ({
      GoogleID: member.GoogleID,
      imageURL: member.imageURL || null,
      name: member.name,
      about: member.about,
      present: true,
    }));

    const message = {
      from: senderGoogleID,
      groupID: groupID,
      text: `${senderGoogleID} added ${members.map((member) => member.GoogleID).join(", ")} to the group`,
      timestamp: new Date(),
      delivered: false,
      deliveredTo: [],
      readBy: [],
      read: false,
      messagetype: "notification",
    };
    for (const member of formattedMembers) {
      const existingMember = groupdata.members.find((m) => m.GoogleID === member.GoogleID);

      if (!existingMember) {
        // New member — push to members array
        groupdata.members.push(member);
      } else if (existingMember.present === false) {
        // Previously removed member — reactivate with updated info
        existingMember.present = true;
        existingMember.imageURL = member.imageURL;
        existingMember.name = member.name;
        existingMember.about = member.about;
      }
    }
    groupdata.groupMessages.push(message);
    await groupdata.save();

    // Emit the notification message to all group members
    if (io) {
      io.to(groupID).emit("receive-groupmessage", message);
      io.to(groupID).emit("groupmemberadded", { formattedMembers, groupID });
    }

    for (const member of members) {
      const user = await Chatdata.findOne({ myGoogleID: member.GoogleID });
      if (!user) {
        console.warn(`User ${member.GoogleID} not found`);
        continue;
      }
      const alreadyJoined = user.totalgroup.some((g) => g.groupID === groupID);
      if (!alreadyJoined) {
        user.totalgroup.push({ groupID, members: groupdata.members });
      }

      await user.save();

      // Safe socket handling
      if (io && userMap) {
        const socketId = userMap.get(member.GoogleID);
        if (socketId) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.join(groupID);
            io.to(socketId).emit("newgroupjoined", groupdata);
            console.log(`Socket ${socketId} joined group room ${groupID}`);
          }
        }
      }
    }

    res.status(200).json({ message: "Members added successfully" });
  } catch (error) {
    console.error("Error adding member to group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/remove-member", authenticateToken, async (req, res) => {
  const io = getIo();
  const { groupID, member } = req.body;
  const senderGoogleID = req.user.email;
  try {
    if (!groupID || !member || !senderGoogleID) {
      return res.status(400).json({
        error: "Missing required fields (groupID, member, senderGoogleID)",
      });
    }
    const groupdata = await Groupdata.findOne({ groupID: groupID });
    if (!groupdata || !groupdata.groupAdmin.some((admin) => admin.GoogleID === senderGoogleID)) {
      return res.status(403).json({
        message: "You are not authorized to remove members from this group",
      });
    }

    // Find the member to be removed
    const removeduser = await Chatdata.findOne({ myGoogleID: member });
    if (!removeduser) {
      return res.status(404).json({
        message: `User with GoogleID ${member} not found`,
      });
    }

    // Update the removed user's group membership
    removeduser.totalgroup = removeduser.totalgroup.filter((group) => group.groupID !== groupID);
    await removeduser.save();

    // Mark member as not present instead of removing
    const memberToUpdate = groupdata.members.find((user) => user.GoogleID === member);

    if (memberToUpdate) {
      memberToUpdate.present = false;
    }

    // Update all group members' groups
    for (const person of groupdata.members) {
      const user = await Chatdata.findOne({ myGoogleID: person.GoogleID });
      if (user) {
        // Find and update the specific group in user's totalgroup
        const groupIndex = user.totalgroup.findIndex((group) => group.groupID === groupID);
        if (groupIndex !== -1) {
          user.totalgroup[groupIndex].members = groupdata.members;
          await user.save();
        }
      }
    }

    // Create notification message
    const message = {
      from: senderGoogleID,
      groupID: groupID,
      text: `${member} was removed by ${senderGoogleID}`,
      timestamp: new Date(),
      delivered: false,
      deliveredTo: [],
      readBy: [],
      read: false,
      messagetype: "notification",
    };
    groupdata.groupMessages.push(message);
    await groupdata.save();

    // Emit the notification to all group members
    if (io) {
      io.to(groupID).emit("receive-groupmessage", message);
      io.to(groupID).emit("removed-group-member", {
        groupID: groupID,
        removedmember: member,
      });

      // Remove the socket from the group room
      const socketId = userMap?.get(member);
      if (socketId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(groupID);
        }
      }
    }

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member from group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/addadmin", authenticateToken, async (req, res) => {
  const io = getIo();
  const { groupID, newAdmin } = req.body;
  const senderGoogleID = req.user.email;
  try {
    if (!groupID || !newAdmin || !senderGoogleID) {
      return res.status(400).json({
        error: "Missing required fields (groupID, newAdmin, senderGoogleID)",
      });
    }
    const groupdata = await Groupdata.findOne({ groupID: groupID });
    if (!groupdata || !groupdata.groupAdmin.some((admin) => admin.GoogleID === senderGoogleID)) {
      return res.status(403).json({
        message: "You are not authorized to change admin of this group",
      });
    }

    const newAdminUser = await Chatdata.findOne({ myGoogleID: newAdmin });
    if (!newAdminUser) {
      return res.status(404).json({
        message: `User with GoogleID ${newAdmin} not found`,
      });
    }

    // Check if already an admin
    if (groupdata.groupAdmin.some((admin) => admin.GoogleID === newAdmin)) {
      return res.status(400).json({
        message: `User with GoogleID ${newAdmin} is already an admin`,
      });
    }

    // Add the new admin
    groupdata.groupAdmin.push({
      GoogleID: newAdmin,
    });

    const message = {
      from: senderGoogleID,
      groupID: groupID,
      text: `${newAdmin} has been promoted to group admin by ${senderGoogleID}`,
      timestamp: new Date(),
      delivered: false,
      deliveredTo: [],
      readBy: [],
      read: false,
      messagetype: "notification",
    };
    groupdata.groupMessages.push(message);
    await groupdata.save();

    // Emit the notification to all group members
    if (io) {
      io.to(groupID).emit("receive-groupmessage", message);
      io.to(groupID).emit("group-admin-update", {
        groupID,
        admins: groupdata.groupAdmin,
      });
    }

    res.status(200).json({
      message: "Admin added successfully",
      admins: groupdata.groupAdmin,
    });
  } catch (error) {
    console.error("Error changing admin to group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/deletegroup", async (req, res) => {
  const io = getIo();
  const { groupID, senderGoogleID } = req.body;
  try {
    if (!groupID || !senderGoogleID) {
      return res.status(400).json({
        error: "Missing required fields (groupID, senderGoogleID)",
      });
    }
    const groupdata = await Groupdata.findOne({ groupID: groupID });
    if (!groupdata || !groupdata.groupAdmin.some((admin) => admin.GoogleID === senderGoogleID)) {
      return res.status(403).json({
        message: "You are not authorized to delete this group",
      });
    }

    // Store members before deletion for notification
    const members = [...groupdata.members];

    await Groupdata.deleteOne({ groupID: groupID });

    for (const member of members) {
      const user = await Chatdata.findOne({ myGoogleID: member.GoogleID });
      if (user) {
        user.totalgroup = user.totalgroup.filter((group) => group.groupID !== groupID);
        await user.save();
      }
    }

    // Notify all members about group deletion
    if (io) {
      io.to(groupID).emit("group-deleted", {
        groupID,
        message: `Group has been deleted by ${senderGoogleID}`,
      });

      // Remove all sockets from the group room
      io.in(groupID).socketsLeave(groupID);
    }

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/leavegroup", authenticateToken, async (req, res) => {
  const io = getIo();
  const { groupID } = req.body;
  const senderGoogleID = req.user.email;

  if (!groupID) {
    return res.status(400).json({ error: "Missing groupID" });
  }

  try {
    const removeduser = await Chatdata.findOne({ myGoogleID: senderGoogleID });
    if (!removeduser) {
      return res.status(404).json({
        message: `User with GoogleID ${senderGoogleID} not found`,
      });
    }

    removeduser.totalgroup = removeduser.totalgroup.filter((group) => group.groupID !== groupID);
    await removeduser.save();

    const group = await Groupdata.findOne({ groupID: groupID });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isSenderAdmin = group.groupAdmin.some((user) => user.GoogleID === senderGoogleID);
    const activeMemberCount = group.members.filter((m) => m.present).length;

    let newAdminID = "";

    // Case 1: Sender is only admin, multiple members exist
    if (isSenderAdmin && activeMemberCount > 1 && group.groupAdmin.length === 1) {
      const presentMembers = group.members.filter(
        (member) =>
          member.GoogleID !== senderGoogleID &&
          member.present === true &&
          !group.groupAdmin.some((admin) => admin.GoogleID === member.GoogleID)
      );

      const newAdmin = presentMembers[0]; // pick the first eligible present member

      if (newAdmin) {
        group.groupAdmin.push({ GoogleID: newAdmin.GoogleID });
        newAdminID = newAdmin.GoogleID;
      }

      // Remove the leaving admin
      group.groupAdmin = group.groupAdmin.filter((admin) => admin.GoogleID !== senderGoogleID);
    }

    // Case 2: Only one member left (sender), delete group
    else if (activeMemberCount <= 1) {
      await Groupdata.deleteOne({ groupID: groupID });
      if (io) {
        io.to(groupID).emit("removed-group-member", {
          groupID: groupID,
          removedmember: senderGoogleID,
        });
      }

      return res.status(200).json({ message: "Group deleted as it has no members left." });
    }

    // Mark the sender as not present
    const leavingMember = group.members.find((user) => user.GoogleID === senderGoogleID);
    if (leavingMember) {
      leavingMember.present = false;
    }

    // Update member lists in Chatdata of others
    for (const person of group.members) {
      const user = await Chatdata.findOne({ myGoogleID: person.GoogleID });
      if (user) {
        const groupIndex = user.totalgroup.findIndex((g) => g.groupID === groupID);
        if (groupIndex !== -1) {
          user.totalgroup[groupIndex].members = group.members;
          await user.save();
        }
      }
    }

    // Add notification for leaving
    const message = {
      from: senderGoogleID,
      groupID,
      text: `${senderGoogleID} left the group`,
      timestamp: new Date(),
      delivered: false,
      deliveredTo: [],
      readBy: [],
      read: false,
      messagetype: "notification",
    };
    group.groupMessages.push(message);

    let newAdminmessage = {};
    if (newAdminID) {
      newAdminmessage = {
        from: senderGoogleID,
        groupID,
        text: `${newAdminID} is now the new group admin`,
        timestamp: new Date(),
        delivered: false,
        deliveredTo: [],
        readBy: [],
        read: false,
        messagetype: "notification",
      };
      group.groupMessages.push(newAdminmessage);
    }

    await group.save();

    // Socket emissions
    if (io) {
      io.to(groupID).emit("receive-groupmessage", message);
      if (newAdminID) {
        io.to(groupID).emit("receive-groupmessage", newAdminmessage);
      }
      io.to(groupID).emit("removed-group-member", {
        groupID,
        removedmember: senderGoogleID,
      });
      io.to(groupID).emit("group-admin-update", {
        groupID,
        admins: group.groupAdmin,
      });

      const socketId = userMap?.get(senderGoogleID);
      if (socketId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(groupID);
        }
      }
    }

    return res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/changedescription", authenticateToken, async (req, res) => {
  const io = getIo();
  const { groupID, description } = req.body;
  const senderGoogleID = req.user.email;
  try {
    if (!groupID || !description || !senderGoogleID) {
      return res.status(400).json({
        error: "Missing required fields (groupID, newAdmin, senderGoogleID)",
      });
    }
    const groupdata = await Groupdata.findOne({ groupID: groupID });
    if (!groupdata || !groupdata.groupAdmin.some((admin) => admin.GoogleID === senderGoogleID)) {
      return res.status(403).json({
        message: "You are not authorized to change admin of this group",
      });
    }
    groupdata.description = description;
    const message = {
      from: senderGoogleID,
      groupID: groupID,
      text: `${senderGoogleID} changed the group description`,
      timestamp: new Date(),
      delivered: false,
      deliveredTo: [],
      readBy: [],
      read: false,
      messagetype: "notification",
    };
    groupdata.groupMessages.push(message);
    await groupdata.save();
    if (io) {
      io.to(groupID).emit("recieve-groupmessage", message);
      io.to(groupID).emit("group-description-changed", {
        groupID: groupID,
        description: description,
      });
    }
    res.status(200).json({
      message: "Group description changed successfully",
      description: description,
    });
  } catch (error) {
    console.error("Error changing group description:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Export both the router and the setIo function
module.exports = { router };
