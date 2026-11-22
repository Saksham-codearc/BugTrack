const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { commentUpdateSchema } = require('../validation/schemas');

const router = express.Router();

router.use(protect);
router.patch('/:id', validate(commentUpdateSchema), updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
