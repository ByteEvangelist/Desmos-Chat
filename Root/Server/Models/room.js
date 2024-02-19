import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { salt: String, hash: String },
  hasPassword: { type: Boolean, default: false },
  create_at: { type: Date, default: Date.now },
});

const Room = mongoose.model('room', roomSchema);

export default Room;
