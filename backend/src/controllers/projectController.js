const { Project } = require('../models/Project');
const { User } = require('../models/User');
const { Ticket } = require('../models/Ticket');
const { Comment } = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  getProjectAccess,
  getTicketStatsByProject,
  assertObjectId,
} = require('../utils/projectAccess');
const { serializeProject } = require('../utils/serializers');
const { canManageProject, canManageMembers, canDeleteProject } = require('../utils/permissions');
const { removeAttachmentFiles } = require('../utils/files');
const { emitToProject, emitToUser } = require('../socket');

const USER_POPULATE = [
  { path: 'owner', select: 'name email role avatarColor' },
  { path: 'members.user', select: 'name email role avatarColor' },
];

const baseKey = (title) => {
  const words = String(title)
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let key = words.length > 1 ? words.map((word) => word[0]).join('') : words[0]?.slice(0, 4) || '';
  key = key.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (!/^[A-Z]/.test(key)) key = `P${key}`;
  return key.slice(0, 4).padEnd(2, 'X');
};

const uniqueProjectKey = async (title) => {
  const base = baseKey(title);
  let candidate = base;
  let counter = 1;

  while (await Project.exists({ key: candidate })) {
    counter += 1;
    candidate = `${base.slice(0, 5)}${counter}`.slice(0, 8);
    if (counter > 50) {
      candidate = `P${Date.now().toString(36).toUpperCase().slice(-5)}`.slice(0, 8);
      break;
    }
  }

  return candidate;
};

async function projectPayload(projectId) {
  const project = await Project.findById(projectId).populate(USER_POPULATE);
  if (!project) throw new ApiError(404, 'Project not found.');
  const statsFor = await getTicketStatsByProject([project._id]);
  return serializeProject(project, statsFor(project._id));
}

const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user._id })
    .populate(USER_POPULATE)
    .sort({ updatedAt: -1 });

  const statsFor = await getTicketStatsByProject(projects.map((project) => project._id));
  const payload = projects.map((project) => serializeProject(project, statsFor(project._id)));

  res.json({ projects: payload });
});

const createProject = asyncHandler(async (req, res) => {
  const { title, description, color, key } = req.body;

  let projectKey = key;
  if (projectKey) {
    if (await Project.exists({ key: projectKey })) {
      throw new ApiError(409, `The project key ${projectKey} is already taken.`);
    }
  } else {
    projectKey = await uniqueProjectKey(title);
  }

  const project = await Project.create({
    title,
    key: projectKey,
    description: description || '',
    color: color || '#4f46e5',
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }],
  });

  const payload = await projectPayload(project._id);
  emitToUser(req.user._id, 'project:added', payload);

  res.status(201).json({ project: payload });
});

const getProject = asyncHandler(async (req, res) => {
  const { project } = await getProjectAccess(req.params.id, req.user._id);
  const payload = await projectPayload(project._id);
  res.json({ project: payload });
});

const updateProject = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectAccess(req.params.id, req.user._id);
  if (!canManageProject(role)) {
    throw new ApiError(403, 'Only project managers and admins can edit this project.');
  }

  const { title, description, color, status } = req.body;
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (color !== undefined) project.color = color;
  if (status !== undefined) project.status = status;

  await project.save();
  const payload = await projectPayload(project._id);
  emitToProject(project._id, 'project:updated', payload);

  res.json({ project: payload });
});

const deleteProject = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectAccess(req.params.id, req.user._id);
  if (!canDeleteProject(role)) {
    throw new ApiError(403, 'Only a project admin can delete this project.');
  }

  const tickets = await Ticket.find({ project: project._id }).select('attachments');
  const attachments = tickets.flatMap((ticket) => ticket.attachments || []);
  const memberIds = project.members.map((member) => String(member.user));

  await Comment.deleteMany({ project: project._id });
  await Ticket.deleteMany({ project: project._id });
  await project.deleteOne();
  await removeAttachmentFiles(attachments);

  emitToProject(project._id, 'project:deleted', { projectId: String(project._id) });
  memberIds.forEach((memberId) => {
    emitToUser(memberId, 'project:removed', { projectId: String(project._id) });
  });

  res.json({ message: 'Project and all of its tickets were deleted.', projectId: String(project._id) });
});

const addMember = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectAccess(req.params.id, req.user._id);
  if (!canManageMembers(role)) {
    throw new ApiError(403, 'Only project managers and admins can invite members.');
  }

  const { email, role: newRole } = req.body;

  if (role !== 'admin' && !['developer', 'viewer'].includes(newRole)) {
    throw new ApiError(403, 'Managers can only invite developers and viewers.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No BugTrack account exists with that email yet. Ask them to register first.');
  }

  const alreadyMember = project.members.some((member) => String(member.user) === String(user._id));
  if (alreadyMember) throw new ApiError(409, 'That person is already a member of this project.');

  project.members.push({ user: user._id, role: newRole });
  await project.save();

  const payload = await projectPayload(project._id);
  emitToProject(project._id, 'project:updated', payload);
  emitToUser(user._id, 'project:added', payload);

  res.status(201).json({ project: payload, message: `${user.name} was added to the project.` });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectAccess(req.params.id, req.user._id);
  assertObjectId(req.params.userId, 'member');

  const member = project.members.find((item) => String(item.user) === String(req.params.userId));
  if (!member) throw new ApiError(404, 'That person is not a member of this project.');

  if (String(member.user) === String(project.owner)) {
    throw new ApiError(400, 'The project owner role cannot be changed.');
  }

  if (role !== 'admin') {
    const canAdjust = ['developer', 'viewer'].includes(member.role) && ['developer', 'viewer'].includes(req.body.role);
    if (!canAdjust) {
      throw new ApiError(403, 'Only a project admin can change manager/admin roles.');
    }
  }

  member.role = req.body.role;
  await project.save();

  const payload = await projectPayload(project._id);
  emitToProject(project._id, 'project:updated', payload);
  res.json({ project: payload, message: 'Member role updated.' });
});

const removeMember = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectAccess(req.params.id, req.user._id);
  assertObjectId(req.params.userId, 'member');

  const member = project.members.find((item) => String(item.user) === String(req.params.userId));
  if (!member) throw new ApiError(404, 'That person is not a member of this project.');

  if (String(member.user) === String(project.owner)) {
    throw new ApiError(400, 'The project owner cannot be removed.');
  }

  if (role !== 'admin' && !['developer', 'viewer'].includes(member.role)) {
    throw new ApiError(403, 'Only a project admin can remove managers or admins.');
  }

  project.members = project.members.filter(
    (item) => String(item.user) !== String(req.params.userId)
  );
  await project.save();

  const removedUserId = String(req.params.userId);
  const payload = await projectPayload(project._id);
  emitToProject(project._id, 'project:updated', payload);
  emitToUser(removedUserId, 'project:removed', { projectId: String(project._id) });

  res.json({ project: payload, message: 'Member removed from the project.' });
});

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
};
