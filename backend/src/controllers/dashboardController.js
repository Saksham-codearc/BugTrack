const { Project } = require('../models/Project');
const { Ticket } = require('../models/Ticket');
const asyncHandler = require('../utils/asyncHandler');
const { serializeTicket } = require('../utils/serializers');
const { TICKET_POPULATE } = require('../utils/projectAccess');

const getDashboard = asyncHandler(async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user._id })
    .select('_id title key color')
    .lean();
  const projectIds = projects.map((project) => project._id);

  const [summaryRows, priorityRows, assignedToMe, myTickets, recentTickets] = await Promise.all([
    Ticket.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', '$$NOW'] },
                    { $ne: ['$status', 'done'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          unassigned: { $sum: { $cond: [{ $eq: ['$assignee', null] }, 1, 0] } },
        },
      },
    ]),
    Ticket.aggregate([
      { $match: { project: { $in: projectIds }, status: { $ne: 'done' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Ticket.countDocuments({ assignee: req.user._id, status: { $ne: 'done' } }),
    Ticket.find({ assignee: req.user._id, status: { $ne: 'done' } })
      .populate(TICKET_POPULATE)
      .sort({ priorityRank: -1, dueDate: 1, updatedAt: -1 })
      .limit(6),
    Ticket.find({ project: { $in: projectIds } })
      .populate(TICKET_POPULATE)
      .sort({ updatedAt: -1 })
      .limit(8),
  ]);

  const summary = summaryRows[0] || {
    total: 0,
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
    unassigned: 0,
  };

  const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
  priorityRows.forEach((row) => {
    byPriority[row._id] = row.count;
  });

  res.json({
    stats: {
      ...summary,
      assignedToMe,
      projectCount: projects.length,
      completionRate: summary.total ? Math.round((summary.done / summary.total) * 100) : 0,
    },
    byPriority,
    myTickets: myTickets.map(serializeTicket),
    recentTickets: recentTickets.map(serializeTicket),
  });
});

module.exports = { getDashboard };
