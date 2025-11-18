import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';
import admin from 'firebase-admin'; // Required for FieldValue

// @desc    Get all community posts
// @route   GET /api/community
// @access  Public
const getAllPosts = asyncHandler(async (req, res) => {
  const postsSnapshot = await db.collection('communityPosts').orderBy('createdAt', 'desc').get();
  const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.status(200).json({ success: true, data: posts });
});

// @desc    Create a new community post
// @route   POST /api/community
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;
  const user = req.user;

  const newPost = {
    userId: user.uid,
    authorName: user.name,
    authorAvatar: user.avatar || '',
    title,
    content,
    tags: tags || [],
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };

  const postRef = await db.collection('communityPosts').add(newPost);
  res.status(201).json({ success: true, data: { id: postRef.id, ...newPost } });
});

// @desc    Get a single post by ID
// @route   GET /api/community/:id
// @access  Public
const getPostById = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const postDoc = await db.collection('communityPosts').doc(postId).get();

  if (!postDoc.exists) {
    res.status(404);
    throw new Error('Post not found');
  }

  res.status(200).json({ success: true, data: { id: postDoc.id, ...postDoc.data() } });
});

// @desc    Update a post
// @route   PUT /api/community/:id
// @access  Private (Owner)
const updatePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const { title, content, tags } = req.body;
  const user = req.user;

  const postRef = db.collection('communityPosts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (postDoc.data().userId !== user.uid) {
    res.status(401);
    throw new Error('User not authorized to update this post');
  }

  await postRef.update({
    title,
    content,
    tags,
    updatedAt: new Date().toISOString(),
  });

  res.status(200).json({ success: true, message: 'Post updated' });
});

// @desc    Delete a post
// @route   DELETE /api/community/:id
// @access  Private (Owner or Admin)
const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const user = req.user;

  const postRef = db.collection('communityPosts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (postDoc.data().userId !== user.uid && user.role !== 'admin') {
    res.status(401);
    throw new Error('User not authorized to delete this post');
  }

  // TODO: Delete comments and likes (or handle via Firebase Functions)
  await postRef.delete();

  res.status(200).json({ success: true, message: 'Post deleted' });
});

// @desc    Add a comment to a post
// @route   POST /api/community/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const { text } = req.body;
  const user = req.user;

  const commentId = db.collection('communityPosts').doc().id; // Generate a unique ID

  const comment = {
    id: commentId,
    userId: user.uid,
    authorName: user.name,
    authorAvatar: user.avatar || '',
    text,
    createdAt: new Date().toISOString(),
  };

  const postRef = db.collection('communityPosts').doc(postId);
  await postRef.update({
    comments: admin.firestore.FieldValue.arrayUnion(comment),
  });

  res.status(201).json({ success: true, data: comment });
});

// @desc    Delete a comment
// @route   DELETE /api/community/:id/comments/:commentId
// @access  Private (Owner or Admin)
const deleteComment = asyncHandler(async (req, res) => {
  const { id: postId, commentId } = req.params;
  const user = req.user;

  const postRef = db.collection('communityPosts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    res.status(404);
    throw new Error('Post not found');
  }

  const post = postDoc.data();
  const comment = post.comments.find(c => c.id === commentId);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (comment.userId !== user.uid && user.role !== 'admin') {
    res.status(401);
    throw new Error('User not authorized to delete this comment');
  }

  await postRef.update({
    comments: admin.firestore.FieldValue.arrayRemove(comment),
  });

  res.status(200).json({ success: true, message: 'Comment deleted' });
});

// @desc    Like a post
// @route   POST /api/community/:id/like
// @access  Private
const likePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.uid;

  const postRef = db.collection('communityPosts').doc(postId);
  await postRef.update({
    likes: admin.firestore.FieldValue.arrayUnion(userId),
  });

  res.status(200).json({ success: true, message: 'Post liked' });
});

// @desc    Unlike a post
// @route   POST /api/community/:id/unlike
// @access  Private
const unlikePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.uid;

  const postRef = db.collection('communityPosts').doc(postId);
  await postRef.update({
    likes: admin.firestore.FieldValue.arrayRemove(userId),
  });

  res.status(200).json({ success: true, message: 'Post unliked' });
});

export {
  getAllPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  likePost,
  unlikePost
};