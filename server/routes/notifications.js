const express = require('express');
const { authenticateJWT } = require('./auth');
const Notification = require('../models/Notification');

const router = express.Router();

// Get user notifications
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ notifications });
  } catch (error) {
    console.error('Fetch notifs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as read
router.patch('/:id/read', authenticateJWT, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    res.json({ notification: notif });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
