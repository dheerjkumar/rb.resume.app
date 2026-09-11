const express = require('express');
const { authenticateJWT } = require('./auth');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ resumes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateJWT, async (req, res) => {
  try {
    const newResume = await Resume.create({
      userId: req.user._id,
      targetCompany: req.body.targetCompany || 'Untitled Resume',
      layoutConfig: { templateId: req.body.templateId || 'classic_ats' }
    });
    res.status(201).json({ resume: newResume });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating resume' });
  }
});

router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).populate('layoutConfig.instituteId');
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ resume });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching resume' });
  }
});

router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const updatedResume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    ).populate('layoutConfig.instituteId');
    if (!updatedResume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ resume: updatedResume });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating resume' });
  }
});

router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const deletedResume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deletedResume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting resume' });
  }
});

router.post('/ats-score', authenticateJWT, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      message: 'AI enhancement is not configured. Please add GEMINI_API_KEY to your .env file.',
    });
  }

  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Clean up history
    user.atsCheckHistory = user.atsCheckHistory.filter(date => date > twentyFourHoursAgo);
    
    if (user.atsCheckHistory.length >= 10) {
      // Must save the cleaned history anyway, but don't add new timestamp
      await user.save();
      return res.status(429).json({ message: 'QUOTA_EXCEEDED' }); // specific flag for frontend to show modal
    }

    const { resumeData, jobDescription } = req.body;
    if (!resumeData) return res.status(400).json({ message: 'resumeData is required.' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are an expert ATS (Applicant Tracking System) parser and recruiter. 
Evaluate the following resume data. If a job description is provided, heavily factor in the keyword match and relevance. If no job description is provided, evaluate based on general industry best practices.

Return STRICT JSON ONLY, matching exactly this structure:
{
  "score": <number 0-100>,
  "breakdown": [
    { "category": "Keyword Match", "score": <number 0-100>, "note": "<string explanation>" },
    { "category": "Formatting/Parseability", "score": <number 0-100>, "note": "<string>" },
    { "category": "Quantifiable Achievements", "score": <number 0-100>, "note": "<string>" },
    { "category": "Completeness", "score": <number 0-100>, "note": "<string>" },
    { "category": "Length", "score": <number 0-100>, "note": "<string>" }
  ],
  "suggestions": [
    "<string action item 1>",
    "<string action item 2>"
  ]
}

DO NOT include markdown formatting like \`\`\`json. Return raw parseable JSON.

Job Description:
${jobDescription || 'None provided'}

Resume Data:
${JSON.stringify(resumeData, null, 2)}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, '');
    text = text.replace(/\s*```\s*$/, '');
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse ATS JSON:', text);
      return res.status(500).json({ message: "Couldn't generate a score, try again" });
    }

    user.atsCheckHistory.push(now);
    await user.save();

    // Save to the resume document
    if (resumeData._id) {
      await Resume.findOneAndUpdate(
        { _id: resumeData._id, userId: user._id },
        { 
          lastAtsScore: {
            score: parsedResult.score,
            breakdown: parsedResult.breakdown,
            suggestions: parsedResult.suggestions,
            jobDescription: jobDescription || '',
            checkedAt: now
          }
        }
      );
    }

    res.json(parsedResult);
  } catch (error) {
    console.error('ATS check error:', error);
    res.status(500).json({ message: "Couldn't generate a score, try again" });
  }
});

module.exports = router;
