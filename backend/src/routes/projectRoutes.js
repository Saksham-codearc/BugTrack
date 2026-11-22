const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
} = require('../controllers/projectController');
const { listTickets, createTicket } = require('../controllers/ticketController');
const {
  projectCreateSchema,
  projectUpdateSchema,
  memberAddSchema,
  memberRoleSchema,
  ticketCreateSchema,
} = require('../validation/schemas');

const router = express.Router();

router.use(protect);

router.route('/').get(listProjects).post(validate(projectCreateSchema), createProject);

router
  .route('/:projectId/tickets')
  .get(listTickets)
  .post(validate(ticketCreateSchema), createTicket);

router
  .route('/:id')
  .get(getProject)
  .patch(validate(projectUpdateSchema), updateProject)
  .delete(deleteProject);

router.post('/:id/members', validate(memberAddSchema), addMember);
router.patch('/:id/members/:userId', validate(memberRoleSchema), updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
