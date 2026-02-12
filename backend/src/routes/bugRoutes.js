const express = require('express');
const router = express.Router();
const {
  createBug, getBugs, getBugById, updateBug, deleteBug,
  addComment, deleteComment, toggleWatch, getBugStats,
} = require('../controllers/bugController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createBugValidator, updateBugValidator, getBugsValidator, addCommentValidator } = require('../validators/bugValidators');

// All routes require authentication
router.use(protect);

// Stats (must be before /:id to avoid conflict)
router.get('/stats', getBugStats);

// CRUD
router.route('/')
  .get(getBugsValidator, validate, getBugs)
  .post(createBugValidator, validate, createBug);

router.route('/:id')
  .get(getBugById)
  .put(updateBugValidator, validate, updateBug)
  .delete(deleteBug);

// Comments
router.route('/:id/comments')
  .post(addCommentValidator, validate, addComment);

router.delete('/:id/comments/:commentId', deleteComment);

// Watch
router.post('/:id/watch', toggleWatch);

module.exports = router;
