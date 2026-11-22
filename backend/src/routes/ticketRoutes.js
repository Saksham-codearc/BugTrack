const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const {
  listMyTickets,
  getTicket,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  uploadAttachments,
  deleteAttachment,
} = require('../controllers/ticketController');
const {
  listComments,
  createComment,
} = require('../controllers/commentController');
const {
  ticketUpdateSchema,
  ticketStatusSchema,
  commentCreateSchema,
} = require('../validation/schemas');

const router = express.Router();

router.use(protect);

// Must be registered before /:id so "mine" is not treated as a ticket id.
router.get('/mine', listMyTickets);

router.get('/:id', getTicket);
router.patch('/:id', validate(ticketUpdateSchema), updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/status', validate(ticketStatusSchema), updateTicketStatus);

router.post('/:id/attachments', upload.array('files', 3), uploadAttachments);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

router
  .route('/:ticketId/comments')
  .get(listComments)
  .post(validate(commentCreateSchema), createComment);

module.exports = router;
