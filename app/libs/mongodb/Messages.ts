import mongoose from "mongoose";
// import Message from "./Message";

const MessageSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
  },
});

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
MessageSchema.index({ threadID: 1 });
export default Message;
