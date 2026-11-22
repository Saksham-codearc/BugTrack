const ROLE_RANK = {
  viewer: 1,
  developer: 2,
  manager: 3,
  admin: 4,
};

const PROJECT_ROLES = ['admin', 'manager', 'developer', 'viewer'];

const hasRole = (role, minimumRole) => (ROLE_RANK[role] || 0) >= (ROLE_RANK[minimumRole] || 0);

const canEditTickets = (role) => hasRole(role, 'developer');
const canManageProject = (role) => hasRole(role, 'manager');
const canManageMembers = (role) => hasRole(role, 'manager');
const canDeleteProject = (role) => role === 'admin';

const canDeleteTicket = (role, ticket, userId) =>
  hasRole(role, 'manager') || String(ticket.reporter?._id || ticket.reporter) === String(userId);

const canModerateComments = (role) => hasRole(role, 'manager');

module.exports = {
  ROLE_RANK,
  PROJECT_ROLES,
  hasRole,
  canEditTickets,
  canManageProject,
  canManageMembers,
  canDeleteProject,
  canDeleteTicket,
  canModerateComments,
};
