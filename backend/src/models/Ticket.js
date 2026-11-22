const mongoose = require('mongoose');

const TICKET_TYPES = ['bug', 'feature', 'task', 'improvement'];
const TICKET_STATUSES = ['todo', 'in_progress', 'done'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_RANK = { low: 1, medium: 2, high: 3, urgent: 4 };

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    number: { type: Number, required: true },
    key: { type: String, required: true, unique: true, index: true },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 8000,
      default: '',
    },
    type: {
      type: String,
      enum: TICKET_TYPES,
      default: 'bug',
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: 'medium',
    },
    priorityRank: {
      type: Number,
      default: 2,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    labels: {
      type: [String],
      default: [],
      validate: {
        validator: (labels) => labels.length <= 8,
        message: 'A ticket can have at most 8 labels',
      },
    },
    dueDate: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ticketSchema.index({ project: 1, status: 1, order: 1 });
ticketSchema.index({ project: 1, assignee: 1 });
ticketSchema.index({ assignee: 1, status: 1 });
ticketSchema.index({ title: 'text', description: 'text', key: 'text' });

ticketSchema.pre('validate', function setPriorityRank(next) {
  this.priorityRank = PRIORITY_RANK[this.priority] || 2;
  next();
});

ticketSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = {
  Ticket,
  TICKET_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  PRIORITY_RANK,
};
