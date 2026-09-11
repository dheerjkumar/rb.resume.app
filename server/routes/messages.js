const express = require('express');
const { authenticateJWT } = require('./auth');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { emitNotification } = require('../socket');

const router = express.Router();

// Get recent conversations
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    })
    .sort({ createdAt: -1 })
    .populate('sender recipient', 'name email profilePhoto')
    .lean();

    const conversationsMap = new Map();
    messages.forEach(msg => {
      // Prevent self-messaging loop
      if (msg.sender._id.toString() === msg.recipient._id.toString()) return;

      const partnerId = msg.sender._id.toString() === req.user._id.toString() ? msg.recipient._id.toString() : msg.sender._id.toString();
      const partner = msg.sender._id.toString() === req.user._id.toString() ? msg.recipient : msg.sender;
      
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner,
          latestMessage: msg,
          unreadCount: (msg.recipient._id.toString() === req.user._id.toString() && !msg.isRead) ? 1 : 0
        });
      } else {
        if (msg.recipient._id.toString() === req.user._id.toString() && !msg.isRead) {
          conversationsMap.get(partnerId).unreadCount++;
        }
      }
    });

    res.json({ conversations: Array.from(conversationsMap.values()) });
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get thread with a specific user
router.get('/:userId', authenticateJWT, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', '_id name profilePhoto')
    .populate('recipient', '_id name profilePhoto')
    .lean();

    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Thread error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { recipient, content } = req.body;
    if (!recipient || !content) return res.status(400).json({ message: 'Recipient and content required' });
    if (recipient === req.user._id.toString()) return res.status(400).json({ message: 'Cannot message yourself' });

    const msg = await Message.create({
      sender: req.user._id,
      recipient,
      content
    });

    // Create Notification for recipient
    const notif = await Notification.create({
      recipient,
      type: 'message',
      fromUser: req.user._id,
      text: `${req.user.name || 'Someone'} sent you a message.`,
      link: `/inbox?userId=${req.user._id}`
    });

    // Emit live events
    emitNotification(recipient, 'new_message', msg);
    emitNotification(recipient, 'notification', { id: notif._id, text: notif.text, link: notif.link });

    res.status(201).json({ message: msg });
  } catch (error) {
    console.error('Send msg error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit message (PATCH)
router.patch('/:id', authenticateJWT, async (req, res) => {
  try {
    const { content } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (msg.isDeleted) return res.status(400).json({ message: 'Cannot edit deleted message' });

    msg.content = content;
    msg.edited = true;
    await msg.save();

    emitNotification(msg.recipient, 'message_edited', msg);
    res.json({ message: msg });
  } catch (error) {
    console.error('Edit msg error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft Delete message (DELETE)
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    msg.content = 'This message was deleted';
    msg.isDeleted = true;
    await msg.save();

    emitNotification(msg.recipient, 'message_deleted', msg);
    res.json({ message: msg });
  } catch (error) {
    console.error('Delete msg error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
