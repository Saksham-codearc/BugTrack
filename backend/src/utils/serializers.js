const serializeUser = (user) => {
  if (!user) return null;
  const id = user._id || user.id;
  return {
    id: String(id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarColor: user.avatarColor,
  };
};

const emptyStats = () => ({
  total: 0,
  todo: 0,
  in_progress: 0,
  done: 0,
  overdue: 0,
  unassigned: 0,
  progress: 0,
});

const serializeProject = (project, stats = emptyStats()) => {
  if (!project) return null;
  return {
    id: String(project._id),
    title: project.title,
    key: project.key,
    description: project.description,
    color: project.color,
    status: project.status,
    owner: serializeUser(project.owner),
    members: (project.members || []).map((member) => ({
      user: serializeUser(member.user),
      role: member.role,
      addedAt: member.addedAt,
    })),
    memberCount: project.members?.length || 0,
    ticketCounter: project.ticketCounter,
    stats,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

const serializeAttachment = (attachment) => ({
  id: String(attachment._id),
  filename: attachment.filename,
  originalName: attachment.originalName,
  mimetype: attachment.mimetype,
  size: attachment.size,
  url: attachment.url,
  uploadedBy: attachment.uploadedBy ? String(attachment.uploadedBy._id || attachment.uploadedBy) : null,
  createdAt: attachment.createdAt,
});

const serializeTicket = (ticket) => {
  if (!ticket) return null;
  const project = ticket.project;
  return {
    id: String(ticket._id),
    key: ticket.key,
    number: ticket.number,
    title: ticket.title,
    description: ticket.description,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    priorityRank: ticket.priorityRank,
    labels: ticket.labels || [],
    dueDate: ticket.dueDate,
    order: ticket.order,
    attachments: (ticket.attachments || []).map(serializeAttachment),
    commentsCount: ticket.commentsCount || 0,
    project:
      project && project.title
        ? {
            id: String(project._id),
            title: project.title,
            key: project.key,
            color: project.color,
          }
        : project
          ? String(project)
          : undefined,
    reporter: serializeUser(ticket.reporter),
    assignee: serializeUser(ticket.assignee),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
};

const serializeComment = (comment) => ({
  id: String(comment._id),
  ticket: String(comment.ticket?._id || comment.ticket),
  project: String(comment.project?._id || comment.project),
  author: serializeUser(comment.author),
  parent: comment.parent ? String(comment.parent._id || comment.parent) : null,
  text: comment.text,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

module.exports = {
  serializeUser,
  serializeProject,
  serializeTicket,
  serializeComment,
  serializeAttachment,
  emptyStats,
};
