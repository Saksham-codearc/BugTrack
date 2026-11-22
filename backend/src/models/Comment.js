const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    text: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

commentSchema.index({ ticket: 1, createdAt: 1 });

commentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Comment };
