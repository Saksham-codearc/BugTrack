const { Comment } = require('../models/Comment');
const { Ticket } = require('../models/Ticket');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getTicketAccess } = require('../utils/projectAccess');
const { serializeComment } = require('../utils/serializers');
const { canModerateComments } = require('../utils/permissions');
const { emitToProject } = require('../socket');

const AUTHOR_SELECT = 'name email role avatarColor';

const fetchComment = (id) => Comment.findById(id).populate('author', AUTHOR_SELECT);

/** Turns a flat comment list into a threaded tree. */
const buildThreads = (comments) => {
  const map = new Map();
  const roots = [];

  comments.forEach((comment) => {
    const node = { ...serializeComment(comment), replies: [] };
    map.set(node.id, node);
  });

  map.forEach((node) => {
    if (node.parent && map.has(node.parent)) {
      map.get(node.parent).replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const listComments = asyncHandler(async (req, res) => {
  const { ticket } = await getTicketAccess(req.params.ticketId, req.user._id);

  const comments = await Comment.find({ ticket: ticket._id })
    .populate('author', AUTHOR_SELECT)
    .sort({ createdAt: 1 });

  res.json({
    comments: buildThreads(comments),
    total: comments.length,
  });
});

const createComment = asyncHandler(async (req, res) => {
  const { ticket, project } = await getTicketAccess(req.params.ticketId, req.user._id);
  const { text, parentId } = req.body;

  if (parentId) {
    const parent = await Comment.findOne({ _id: parentId, ticket: ticket._id });
    if (!parent) throw new ApiError(400, 'The comment you are replying to was not found.');
  }

  const comment = await Comment.create({
    ticket: ticket._id,
    project: project._id,
    author: req.user._id,
    text,
    parent: parentId || null,
  });

  await Ticket.updateOne({ _id: ticket._id }, { $inc: { commentsCount: 1 } });

  const populated = await fetchComment(comment._id);
  const payload = serializeComment(populated);
  emitToProject(project._id, 'comment:created', { ...payload, replies: [] });

  res.status(201).json({ comment: { ...payload, replies: [] } });
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found.');

  const { project } = await getTicketAccess(comment.ticket, req.user._id);

  if (String(comment.author) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own comments.');
  }

  comment.text = req.body.text;
  await comment.save();

  const populated = await fetchComment(comment._id);
  const payload = serializeComment(populated);
  emitToProject(project._id, 'comment:updated', payload);

  res.json({ comment: payload });
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found.');

  const { ticket, project, role } = await getTicketAccess(comment.ticket, req.user._id);

  const isAuthor = String(comment.author) === String(req.user._id);
  if (!isAuthor && !canModerateComments(role)) {
    throw new ApiError(403, 'You can only delete your own comments.');
  }

  // Remove the comment and every nested reply below it.
  const toDelete = [comment._id];
  let frontier = [comment._id];

  while (frontier.length) {
    const children = await Comment.find({ parent: { $in: frontier } }).select('_id').lean();
    frontier = children.map((child) => child._id);
    toDelete.push(...frontier);
  }

  await Comment.deleteMany({ _id: { $in: toDelete } });

  const updatedTicket = await Ticket.findByIdAndUpdate(
    ticket._id,
    { $inc: { commentsCount: -toDelete.length } },
    { new: true }
  );
  if (updatedTicket && updatedTicket.commentsCount < 0) {
    updatedTicket.commentsCount = 0;
    await updatedTicket.save();
  }

  emitToProject(project._id, 'comment:deleted', {
    ticketId: String(ticket._id),
    commentIds: toDelete.map(String),
  });

  res.json({ message: 'Comment deleted.', commentIds: toDelete.map(String) });
});

module.exports = { listComments, createComment, updateComment, deleteComment };
