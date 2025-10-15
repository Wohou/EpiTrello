import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Virtual for lists count
boardSchema.virtual('lists', {
  ref: 'List',
  localField: '_id',
  foreignField: 'board'
});

boardSchema.virtual('lists_count', {
  ref: 'List',
  localField: '_id',
  foreignField: 'board',
  count: true
});

boardSchema.set('toJSON', { virtuals: true });
boardSchema.set('toObject', { virtuals: true });

export default mongoose.model('Board', boardSchema);
