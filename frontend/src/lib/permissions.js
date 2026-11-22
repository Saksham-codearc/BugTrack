export const ROLE_RANK = {
  viewer: 1,
  developer: 2,
  manager: 3,
  admin: 4,
};

export const hasRole = (role, minimum) => (ROLE_RANK[role] || 0) >= (ROLE_RANK[minimum] || 0);

export const canEditTickets = (role) => hasRole(role, 'developer');
export const canManageProject = (role) => hasRole(role, 'manager');
export const canManageMembers = (role) => hasRole(role, 'manager');
export const canDeleteProject = (role) => role === 'admin';
export const canModerateComments = (role) => hasRole(role, 'manager');

export const canDeleteTicket = (role, ticket, userId) =>
  hasRole(role, 'manager') || (ticket?.reporter?.id && ticket.reporter.id === userId);
