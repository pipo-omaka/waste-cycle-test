import express from 'express';
import {
  getAllPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  likePost,
  unlikePost,
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllPosts)
  .post(protect, createPost);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.route('/:id/comments')
  .post(protect, addComment);

router.route('/:id/comments/:commentId')
  .delete(protect, deleteComment);

router.route('/:id/like')
  .post(protect, likePost);

router.route('/:id/unlike')
  .post(protect, unlikePost);

export default router;