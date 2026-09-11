const express = require('express');
const { authenticateJWT } = require('./auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { emitNotification } = require('../socket');

const router = express.Router();

// â”€â”€ GET /api/posts/feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/feed', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    let authors = user.following || [];
    
    // Fallback: If not following anyone, return all posts globally
    let query = {};
    if (authors.length > 0) {
      authors.push(req.user._id); // include own posts
      query = { author: { $in: authors } };
    }
    
    const posts = await Post.find(query)
      .populate('author', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const postsWithCounts = await Promise.all(posts.map(async post => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      return { ...post, commentCount };
    }));

    res.json({ posts: postsWithCounts });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ GET /api/posts/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email profilePhoto')
      .lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Fetch a flat list of all comments for this post
    const comments = await Comment.find({ postId: post._id })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ post, comments });
  } catch (error) {
    console.error('Post view error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ POST /api/posts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const newPost = await Post.create({
      author: req.user._id,
      content,
    });
    
    const populated = await newPost.populate('author', 'name email profilePhoto');
    res.status(201).json({ post: populated });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ PUT /api/posts/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    post.content = req.body.content || post.content;
    await post.save();
    
    const populated = await post.populate('author', 'name email profilePhoto');
    res.json({ post: populated });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ POST /api/posts/:id/like â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/:id/like', authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.indexOf(req.user._id);
    if (idx > -1) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        emitNotification(post.author, 'post_liked', { postId: post._id, by: req.user.name || 'Someone' });
      }
    }
    
    await post.save();
    res.json({ likes: post.likes });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ POST /api/posts/:postId/comments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/:postId/comments', authenticateJWT, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      postId: post._id,
      author: req.user._id,
      content,
      parentCommentId: parentCommentId || null
    });

    const populated = await comment.populate('author', 'name profilePhoto');
    
    if (post.author.toString() !== req.user._id.toString()) {
      emitNotification(post.author, 'comment_added', { postId: post._id, commentId: comment._id, by: req.user.name || 'Someone' });
    }

    res.status(201).json({ comment: populated });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ DELETE /api/posts/:postId/comments/:commentId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete('/:postId/comments/:commentId', authenticateJWT, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate('author');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    // Allow author or admin to delete
    if (comment.author._id.toString() !== req.user._id.toString() && req.user.email !== 'rb.resume.app@gmail.com') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.deleteMany({ parentCommentId: comment._id }); // delete child comments
    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Comment delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ PUT /api/posts/:postId/comments/:commentId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/:postId/comments/:commentId', authenticateJWT, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.content = req.body.content || comment.content;
    await comment.save();
    
    const populated = await comment.populate('author', 'name profilePhoto');
    res.json({ comment: populated });
  } catch (error) {
    console.error('Comment edit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€ POST /api/posts/:postId/comments/:commentId/like â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/:postId/comments/:commentId/like', authenticateJWT, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const idx = comment.likes.indexOf(req.user._id);
    if (idx > -1) {
      comment.likes.splice(idx, 1);
    } else {
      comment.likes.push(req.user._id);
    }
    
    await comment.save();
    res.json({ likes: comment.likes });
  } catch (error) {
    console.error('Comment like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
