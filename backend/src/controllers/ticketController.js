const { Ticket, TICKET_STATUSES, TICKET_PRIORITIES, TICKET_TYPES } = require('../models/Ticket');
const { Project } = require('../models/Project');
const { Comment } = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  getProjectAccess,
  getTicketAccess,
  assertObjectId,
  TICKET_POPULATE,
} = require('../utils/projectAccess');
const { serializeTicket } = require('../utils/serializers');
const { canEditTickets, canDeleteTicket } = require('../utils/permissions');
const { escapeRegex } = require('../utils/helpers');
const { removeAttachmentFiles } = require('../utils/files');
const { emitToProject } = require('../socket');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  updated: { updatedAt: -1 },
  priority: { priorityRank: -1, createdAt: -1 },
  dueDate: { dueDate: 1, createdAt: -1 },
  order: { order: 1, createdAt: -1 },
};

const parseDueDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'The due date is invalid.');
  return date;
};

const ensureProjectMember = (project, userId, label = 'Assignee') => {
  if (!userId) return null;
  assertObjectId(userId, label.toLowerCase());
  const isMember = project.members.some((member) => String(member.user) === String(userId));
  if (!isMember) throw new ApiError(400, `${label} must be a member of this project.`);
  return userId;
};

const fetchTicket = (id) => Ticket.findById(id).populate(TICKET_POPULATE);

/**
 * Move a ticket to a status/column and renumber the affected column(s).
 */
async function moveTicket(ticket, status, position) {
  const oldStatus = ticket.status;

  const [destination, source] = await Promise.all([
    Ticket.find({ project: ticket.project, status, _id: { $ne: ticket._id } })
      .sort({ order: 1 })
      .select('_id')
      .lean(),
    oldStatus === status
      ? Promise.resolve([])
      : Ticket.find({ project: ticket.project, status: oldStatus, _id: { $ne: ticket._id } })
          .sort({ order: 1 })
          .select('_id')
          .lean(),
  ]);

  const ids = destination.map((item) => String(item._id));
  const insertionIndex = Number.isInteger(position)
    ? Math.max(0, Math.min(position, ids.length))
    : ids.length;
  ids.splice(insertionIndex, 0, String(ticket._id));

  const operations = ids.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { status, order: index } },
    },
  }));

  if (oldStatus !== status) {
    source.forEach((item, index) => {
      operations.push({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { order: index } },
        },
      });
    });
  }

  await Ticket.bulkWrite(operations);
  return fetchTicket(ticket._id);
}

const listTickets = asyncHandler(async (req, res) => {
  const { project } = await getProjectAccess(req.params.projectId, req.user._id);
  const { status, priority, type, assignee, q, sort = 'newest' } = req.query;

  const filter = { project: project._id };

  if (status) {
    if (!TICKET_STATUSES.includes(status)) throw new ApiError(400, 'Invalid status filter.');
    filter.status = status;
  }
  if (priority) {
    if (!TICKET_PRIORITIES.includes(priority)) throw new ApiError(400, 'Invalid priority filter.');
    filter.priority = priority;
  }
  if (type) {
    if (!TICKET_TYPES.includes(type)) throw new ApiError(400, 'Invalid type filter.');
    filter.type = type;
  }
  if (assignee) {
    if (assignee === 'me') filter.assignee = req.user._id;
    else if (assignee === 'unassigned') filter.assignee = null;
    else {
      assertObjectId(assignee, 'assignee');
      filter.assignee = assignee;
    }
  }
  if (q && String(q).trim()) {
    const regex = new RegExp(escapeRegex(String(q).trim()), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { key: regex }, { labels: regex }];
  }

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate(TICKET_POPULATE)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Ticket.countDocuments(filter),
  ]);

  res.json({
    tickets: tickets.map(serializeTicket),
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    limit,
  });
});

const listMyTickets = asyncHandler(async (req, res) => {
  const filter = { assignee: req.user._id };
  if (req.query.status && TICKET_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.q && String(req.query.q).trim()) {
    const regex = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    filter.$or = [{ title: regex }, { key: regex }, { description: regex }];
  }

  const [tickets, grouped] = await Promise.all([
    Ticket.find(filter)
      .populate(TICKET_POPULATE)
      .sort({ priorityRank: -1, dueDate: 1, updatedAt: -1 })
      .limit(150),
    Ticket.aggregate([
      { $match: { assignee: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const stats = { total: 0, todo: 0, in_progress: 0, done: 0 };
  grouped.forEach((row) => {
    stats[row._id] = row.count;
    stats.total += row.count;
  });

  res.json({ tickets: tickets.map(serializeTicket), stats });
});

const getTicket = asyncHandler(async (req, res) => {
  const { ticket, role } = await getTicketAccess(req.params.id, req.user._id);
  const populated = await fetchTicket(ticket._id);
  res.json({ ticket: serializeTicket(populated), role });
});

const createTicket = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectAccess(req.params.projectId, req.user._id);
  if (!canEditTickets(role)) {
    throw new ApiError(403, 'Viewers cannot create tickets. Ask for a developer role.');
  }

  const {
    title,
    description = '',
    type = 'bug',
    status = 'todo',
    priority = 'medium',
    assignee = null,
    labels = [],
    dueDate,
  } = req.body;

  ensureProjectMember(project, assignee);
  if (!TICKET_STATUSES.includes(status)) throw new ApiError(400, 'Invalid ticket status.');

  // Atomic increment prevents duplicate ticket numbers under concurrent writes.
  const incrementedProject = await Project.findByIdAndUpdate(
    project._id,
    { $inc: { ticketCounter: 1 } },
    { new: true }
  );
  if (!incrementedProject) throw new ApiError(404, 'Project not found.');

  const number = incrementedProject.ticketCounter;
  const lastInColumn = await Ticket.findOne({ project: project._id, status })
    .sort({ order: -1 })
    .select('order');

  const ticket = await Ticket.create({
    project: project._id,
    number,
    key: `${incrementedProject.key}-${number}`,
    title,
    description,
    type,
    status,
    priority,
    reporter: req.user._id,
    assignee: assignee || null,
    labels: labels || [],
    dueDate: parseDueDate(dueDate),
    order: lastInColumn ? lastInColumn.order + 1 : 0,
  });

  const populated = await fetchTicket(ticket._id);
  emitToProject(project._id, 'ticket:created', serializeTicket(populated));

  res.status(201).json({ ticket: serializeTicket(populated) });
});

const updateTicket = asyncHandler(async (req, res) => {
  const { ticket, project, role } = await getTicketAccess(req.params.id, req.user._id);
  if (!canEditTickets(role)) {
    throw new ApiError(403, 'Viewers cannot edit tickets.');
  }

  const { title, description, type, status, priority, assignee, labels, dueDate } = req.body;

  if (title !== undefined) ticket.title = title;
  if (description !== undefined) ticket.description = description;
  if (type !== undefined) ticket.type = type;
  if (priority !== undefined) ticket.priority = priority;
  if (labels !== undefined) ticket.labels = labels;
  if (assignee !== undefined) ticket.assignee = ensureProjectMember(project, assignee);
  if (dueDate !== undefined) ticket.dueDate = parseDueDate(dueDate);

  if (status !== undefined && status !== ticket.status) {
    await ticket.save();
    const moved = await moveTicket(ticket, status, undefined);
    const payload = serializeTicket(moved);
    emitToProject(project._id, 'ticket:updated', payload);
    return res.json({ ticket: payload });
  }

  await ticket.save();
  const populated = await fetchTicket(ticket._id);
  const payload = serializeTicket(populated);
  emitToProject(project._id, 'ticket:updated', payload);

  return res.json({ ticket: payload });
});

const updateTicketStatus = asyncHandler(async (req, res) => {
  const { ticket, project, role } = await getTicketAccess(req.params.id, req.user._id);
  if (!canEditTickets(role)) {
    throw new ApiError(403, 'Only developers, managers and admins can move tickets.');
  }

  const { status, position } = req.body;
  if (ticket.status === status && position === undefined) {
    const current = await fetchTicket(ticket._id);
    return res.json({ ticket: serializeTicket(current) });
  }

  const moved = await moveTicket(ticket, status, position);
  const payload = serializeTicket(moved);
  emitToProject(project._id, 'ticket:updated', payload);

  return res.json({ ticket: payload });
});

const deleteTicket = asyncHandler(async (req, res) => {
  const { ticket, project, role } = await getTicketAccess(req.params.id, req.user._id);

  if (!canDeleteTicket(role, ticket, req.user._id)) {
    throw new ApiError(403, 'You do not have permission to delete this ticket.');
  }

  await Comment.deleteMany({ ticket: ticket._id });
  await removeAttachmentFiles(ticket.attachments);
  await ticket.deleteOne();

  emitToProject(project._id, 'ticket:deleted', {
    ticketId: String(ticket._id),
    projectId: String(project._id),
  });

  res.json({ message: 'Ticket deleted.', ticketId: String(ticket._id), projectId: String(project._id) });
});

const uploadAttachments = asyncHandler(async (req, res) => {
  const { ticket, project, role } = await getTicketAccess(req.params.id, req.user._id);
  if (!canEditTickets(role)) {
    throw new ApiError(403, 'You do not have permission to add attachments.');
  }

  const files = req.files || [];
  if (!files.length) throw new ApiError(400, 'Choose at least one image or PDF to upload.');

  const attachments = files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/${file.filename}`,
    uploadedBy: req.user._id,
  }));

  ticket.attachments.push(...attachments);

  try {
    await ticket.save();
  } catch (error) {
    await removeAttachmentFiles(attachments);
    throw error;
  }

  const populated = await fetchTicket(ticket._id);
  const payload = serializeTicket(populated);
  emitToProject(project._id, 'ticket:updated', payload);

  res.status(201).json({ ticket: payload });
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const { ticket, project, role } = await getTicketAccess(req.params.id, req.user._id);
  if (!canEditTickets(role)) {
    throw new ApiError(403, 'You do not have permission to remove attachments.');
  }

  const attachment = ticket.attachments.id(req.params.attachmentId);
  if (!attachment) throw new ApiError(404, 'Attachment not found.');

  await removeAttachmentFiles([attachment]);
  ticket.attachments = ticket.attachments.filter(
    (item) => String(item._id) !== String(attachment._id)
  );
  await ticket.save();

  const populated = await fetchTicket(ticket._id);
  const payload = serializeTicket(populated);
  emitToProject(project._id, 'ticket:updated', payload);

  res.json({ ticket: payload });
});

module.exports = {
  listTickets,
  listMyTickets,
  getTicket,
  createTicket,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  uploadAttachments,
  deleteAttachment,
};
