const express = require('express');
const Institute = require('../models/Institute');

const router = express.Router();

router.get('/nirf', async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ category: 1, name: 1 });
    res.json({ institutes });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching institutes' });
  }
});

module.exports = router;
