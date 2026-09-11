const express = require('express');
const { authenticateJWT } = require('./auth');
const User = require('../models/User');

const router = express.Router();

router.patch('/tour', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { hasSeenTour: true },
      { new: true }
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Track a referral visit
router.post('/track-referral', async (req, res) => {
  try {
    const { code, fingerprint } = req.body;
    if (!code || !fingerprint) {
      return res.status(400).json({ message: 'Missing referral code or fingerprint.' });
    }

    const user = await User.findOne({ referralCode: code });
    if (!user) {
      return res.status(404).json({ message: 'Referral code not found.' });
    }

    // Filter out old visits (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    user.referralVisits = user.referralVisits.filter(v => v.date >= sevenDaysAgo);

    // Check if this fingerprint has already visited in the last 7 days
    const alreadyVisited = user.referralVisits.some(v => v.fingerprint === fingerprint);

    if (!alreadyVisited) {
      user.referralVisits.push({ fingerprint, date: new Date() });
      
      // If we hit 5 visits, grant bonus
      if (user.referralVisits.length >= 5) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        user.bonusQuotaExpiringAt = nextWeek;
        // Clear visits for next cycle
        user.referralVisits = [];
      }

      await user.save();
    }

    res.json({ message: 'Referral processed.' });

  } catch (error) {
    console.error('Referral tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow a user
router.post('/:id/follow', authenticateJWT, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const user = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isFollowing = user.following.includes(targetUserId);
    if (isFollowing) {
      user.following.pull(targetUserId);
      targetUser.followers.pull(user._id);
    } else {
      user.following.push(targetUserId);
      targetUser.followers.push(user._id);
    }

    await user.save();
    await targetUser.save();

    res.json({ following: user.following });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public profile
router.get('/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email profilePhoto followers following').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ profile: user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
