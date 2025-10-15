import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  position: {
    type: Number,
    default: 0
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
cardSchema.index({ list: 1, position: 1 });

export default mongoose.model('Card', cardSchema);
