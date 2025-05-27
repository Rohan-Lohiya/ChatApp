const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  name: { type: String, required: true },
  GoogleID: { type: String, required: true },
  image: { type: String }, // URL or base64
  about: { type: String, default: "Hey I am using chat app"}, // User's about information
});

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true }, // GoogleID
  to: { type: String, required: true },   // GoogleID
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
});

const onlineUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  GoogleID: { type: String, required: true },
});
const isActiveSchema = new mongoose.Schema({
  GoogleID: {type: String, required: true},
})

const totalgroupSchema = new mongoose.Schema({
  groupID: { 
    type: String, 
  },
  members: [{ 
    type: {
      GoogleID: { type: String, required: true },
      imageURL: { type: String, default: null }
    },
    required: true 
  }],
});

const chatDataSchema = new mongoose.Schema(
  {
    myGoogleID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String }, // Google profile picture
    about: { type: String, default: "Hey I am using chat app" , maxlength: 100, }, // User's about information

    friends: [friendSchema],
    messages: [messageSchema],
    onlineUsers: [onlineUserSchema],
    isActive: [isActiveSchema],
    totalgroup: [totalgroupSchema],
  },
  {
    timestamps: true,
  }
);


const Chatdata = mongoose.model('Chatdata', chatDataSchema);

module.exports = Chatdata;
