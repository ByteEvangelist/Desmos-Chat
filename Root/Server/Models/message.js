import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  roomId: { type: String, required: true },
  create_at: { type: Date, default: Date.now },
});

const Message = mongoose.model('message', messageSchema);
export default Message;
