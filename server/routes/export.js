const express = require('express');
const path    = require('path');
const { authenticateJWT } = require('./auth');
const Resume   = require('../models/Resume');
const User     = require('../models/User');
const Institute = require('../models/Institute');
const { generateLatexPdf, cleanup } = require('../utils/latexGenerator');
const { sendResumeEmail } = require('../utils/emailService');

const router = express.Router();

/**
 * Quota middleware — shared by both /latex and /track.
 * Prunes history older than 24 h, then rejects with 429 if limit reached.
 * Does NOT write to history here; /latex does so only after success.
 */
async function checkPdfQuota(req, res, next) {
  try {
    const user = req.user;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Prune stale timestamps
    user.pdfExportHistory = (user.pdfExportHistory || []).filter(d => d > cutoff);

    // Determine current limit based on gamification bonus
    const hasBonus = user.bonusQuotaExpiringAt && user.bonusQuotaExpiringAt > new Date();
    const currentLimit = hasBonus ? 3 : 2;

    if (user.pdfExportHistory.length >= currentLimit) {
      return res.status(429).json({
        code: 'QUOTA_EXCEEDED',
        message: `You have reached the daily limit of ${currentLimit} PDF exports. Refer friends to unlock more!`,
      });
    }

    next();
  } catch (err) {
    console.error('Quota check error:', err);
    res.status(500).json({ message: 'Server error during quota check.' });
  }
}

// ── POST /api/export/latex ──────────────────────────────────────────────────
// Compiles a LaTeX PDF from the user's resume.
// Quota is ONLY deducted after successful compilation.
router.post('/latex', authenticateJWT, checkPdfQuota, async (req, res) => {
  const { resumeId } = req.body;
  let pdfPath = null;
  let tmpDir  = null;

  try {
    if (!resumeId) return res.status(400).json({ message: 'resumeId is required.' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id }).lean();
    if (!resume) return res.status(404).json({ message: 'Resume not found.' });

    let institute = null;
    if (resume.layoutConfig?.instituteId) {
      const instId = resume.layoutConfig.instituteId?._id ?? resume.layoutConfig.instituteId;
      institute = await Institute.findById(instId).lean();
    }

    pdfPath = await generateLatexPdf(resume, institute);
    tmpDir  = path.dirname(pdfPath);

    // Note: Quota is no longer deducted automatically here to support Share cancellations.
    // The frontend must explicitly call POST /api/export/track after a successful export/share.

    const filename = `${(resume.targetCompany || 'Resume').replace(/[^a-z0-9]/gi, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.sendFile(pdfPath, {}, (err) => {
      if (tmpDir) cleanup(tmpDir);
      if (err && !res.headersSent) {
        console.error('sendFile error:', err);
      }
    });

  } catch (err) {
    console.error('LaTeX export error:', err.message);
    if (tmpDir) cleanup(tmpDir);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message, detail: err.message });
    }
  }
});

// ── POST /api/export/email ──────────────────────────────────────────────────
router.post('/email', authenticateJWT, checkPdfQuota, async (req, res) => {
  const { resumeId, email } = req.body;
  let pdfPath = null;
  let tmpDir  = null;

  try {
    if (!resumeId || !email) return res.status(400).json({ message: 'resumeId and email are required.' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id }).lean();
    if (!resume) return res.status(404).json({ message: 'Resume not found.' });

    let institute = null;
    if (resume.layoutConfig?.instituteId) {
      const instId = resume.layoutConfig.instituteId?._id ?? resume.layoutConfig.instituteId;
      institute = await Institute.findById(instId).lean();
    }

    // 1. Compile PDF
    pdfPath = await generateLatexPdf(resume, institute);
    tmpDir  = path.dirname(pdfPath);
    const filename = `${(resume.targetCompany || 'Resume').replace(/[^a-z0-9]/gi, '_')}.pdf`;

    // 2. Send email
    await sendResumeEmail(email, pdfPath, filename);

    // 3. ✅ SUCCESS (Both PDF & Email) — deduct quota
    req.user.pdfExportHistory.push(new Date());
    await req.user.save();

    res.json({ message: 'Resume emailed successfully!' });
  } catch (err) {
    console.error('Email export error:', err.message);
    res.status(500).json({ message: err.message, detail: err.message });
  } finally {
    if (tmpDir) cleanup(tmpDir);
  }
});

// ── POST /api/export/track ──────────────────────────────────────────────────
router.post('/track', authenticateJWT, checkPdfQuota, async (req, res) => {
  try {
    req.user.pdfExportHistory.push(new Date());
    await req.user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
