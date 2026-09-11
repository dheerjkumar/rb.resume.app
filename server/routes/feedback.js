const express = require('express');
const jwt = require('jsonwebtoken');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Optional Auth Middleware for Feedback
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (!err && decoded) {
      try {
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
      } catch (e) {
        // ignore error and proceed as anonymous
      }
    }
    next();
  });
};

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const userId = req.user ? req.user._id : null;
    const feedback = await Feedback.create({ userId, name, email, message });

    try {
      const emailSubject = `New Feedback/Contact Submission from ${name || 'Anonymous'}`;
      const emailText = `Name: ${name || 'N/A'}\nEmail: ${email || 'N/A'}\nUser ID: ${userId || 'Anonymous'}\n\nMessage:\n${message}`;
      
      await sendEmail('rb.resume.app@gmail.com', emailSubject, emailText);
    } catch (emailError) {
      console.error('Failed to send feedback email (submission saved to DB):', emailError.message);
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Feedback submit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const { authenticateJWT } = require('./auth');

// Get all feedback (Admin only)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden: Admins only' });
    const feedbackList = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email profilePhoto')
      .lean();
    res.json({ feedback: feedbackList });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
