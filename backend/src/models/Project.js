const mongoose = require('mongoose');
const { PROJECT_ROLES } = require('../utils/permissions');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: PROJECT_ROLES, default: 'developer' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z][A-Z0-9]{1,7}$/, 'Project key must be 2-8 letters/numbers and start with a letter'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    color: {
      type: String,
      default: '#4f46e5',
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    ticketCounter: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

projectSchema.index({ 'members.user': 1 });

projectSchema.virtual('memberCount').get(function memberCount() {
  return this.members?.length || 0;
});

projectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

const Project = mongoose.model('Project', projectSchema);

module.exports = { Project };
