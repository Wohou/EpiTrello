import mongoose from 'mongoose';

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: Number,
    default: 0
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for cards count
listSchema.virtual('cards', {
  ref: 'Card',
  localField: '_id',
  foreignField: 'list'
});

listSchema.virtual('cards_count', {
  ref: 'Card',
  localField: '_id',
  foreignField: 'list',
  count: true
});

listSchema.set('toJSON', { virtuals: true });
listSchema.set('toObject', { virtuals: true });

// Index for efficient querying
listSchema.index({ board: 1, position: 1 });

export default mongoose.model('List', listSchema);
