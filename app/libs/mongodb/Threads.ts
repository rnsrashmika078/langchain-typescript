import mongoose from "mongoose";
// import Message from "./Message";

const ThreadSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
  },
});

const Thread = mongoose.models.Thread || mongoose.model("Thread", ThreadSchema);
ThreadSchema.index({ threadId: 1 });
export default Thread;
