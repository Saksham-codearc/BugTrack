const mongoose = require('mongoose');
const { Project } = require('../models/Project');
const { Ticket } = require('../models/Ticket');
const { emptyStats } = require('./serializers');
const ApiError = require('./ApiError');

const assertObjectId = (id, label = 'resource') => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label} identifier.`);
  }
};

/**
 * Loads a project and asserts the user is a member.
 */
async function getProjectAccess(projectId, userId, { populate = false } = {}) {
  assertObjectId(projectId, 'project');

  let query = Project.findById(projectId);
  if (populate) {
    query = query
      .populate('owner', 'name email role avatarColor')
      .populate('members.user', 'name email role avatarColor');
  }

  const project = await query;
  if (!project) throw new ApiError(404, 'Project not found.');

  const membership = project.members.find(
    (member) => String(member.user?._id || member.user) === String(userId)
  );

  if (!membership) throw new ApiError(403, 'You do not have access to this project.');

  return { project, role: membership.role };
}

/**
 * Loads a ticket plus the project role of the requesting user.
 */
async function getTicketAccess(ticketId, userId) {
  assertObjectId(ticketId, 'ticket');

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  const project = await Project.findById(ticket.project);
  if (!project) throw new ApiError(404, 'The project for this ticket no longer exists.');

  const membership = project.members.find(
    (member) => String(member.user) === String(userId)
  );
  if (!membership) throw new ApiError(403, 'You do not have access to this ticket.');

  return { ticket, project, role: membership.role };
}

/**
 * Aggregated ticket stats keyed by project id, for one or many projects.
 */
async function getTicketStatsByProject(projectIds) {
  const ids = projectIds.map((id) => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id));
  const rows = await Ticket.aggregate([
    { $match: { project: { $in: ids } } },
    {
      $group: {
        _id: '$project',
        total: { $sum: 1 },
        todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
        in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$dueDate', null] }, { $lt: ['$dueDate', '$$NOW'] }, { $ne: ['$status', 'done'] }] },
              1,
              0,
            ],
          },
        },
        unassigned: { $sum: { $cond: [{ $eq: ['$assignee', null] }, 1, 0] } },
      },
    },
  ]);

  const map = new Map();
  rows.forEach((row) => {
    const stats = {
      ...emptyStats(),
      ...row,
      _id: undefined,
      progress: row.total ? Math.round((row.done / row.total) * 100) : 0,
    };
    delete stats._id;
    map.set(String(row._id), stats);
  });

  return (projectId) => map.get(String(projectId)) || emptyStats();
}

const TICKET_POPULATE = [
  { path: 'reporter', select: 'name email role avatarColor' },
  { path: 'assignee', select: 'name email role avatarColor' },
  { path: 'project', select: 'title key color' },
];

module.exports = {
  assertObjectId,
  getProjectAccess,
  getTicketAccess,
  getTicketStatsByProject,
  TICKET_POPULATE,
};
