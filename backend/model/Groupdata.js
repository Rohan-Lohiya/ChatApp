const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema({
  from: { type: String, required: true }, // GoogleID
  groupID: { type: String, required: true }, // Group ID
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
  deliveredTo: [{ type: String }], // Array of GoogleIDs
  readBy: [{ type: String }], // Array of GoogleIDs
  read: { type: Boolean, default: false },
  messagetype: { type: String, default: "text" }, // text, image, video, etc.
});

const onlineUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  GoogleID: { type: String, required: true },
});
const isActiveSchema = new mongoose.Schema({
  GoogleID: {type: String, required: true},
})


const groupdataSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50, // Optional: Prevent overly long names
    },
    groupID: {
      type: String,
      required: true,
      unique: true,
    },
    groupImage: {
      type: String,
      default: null, // or a default image URL
    },
    members: [
      {
        type: {
          GoogleID: { type: String, required: true },
          imageURL: { type: String, default: null },
          name: { type: String, required: true },
          about: { type: String, default: "Hey I am using chat app", maxlength: 100, }, // User's about information
          present: {type: Boolean, required: true},
        },
        required: true,
      },
    ],
    groupAdmin: [
      {
        type: {
          GoogleID: { type: String, required: true },
        },
        required: true,
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    groupMessages: [groupMessageSchema],
  },
  {
    timestamps: true,
  }
);

const Groupdata = mongoose.model("Groupdata", groupdataSchema);

module.exports = Groupdata;
