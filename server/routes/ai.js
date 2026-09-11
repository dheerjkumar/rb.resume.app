const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticateJWT } = require('./auth');

const router = express.Router();

/**
 * Clean up HTML output from Gemini.
 */
function extractCleanHtml(raw) {
  let text = raw.trim();
  text = text.replace(/^```(?:html)?\s*/i, '');
  text = text.replace(/\s*```\s*$/, '');
  const firstTag = text.indexOf('<');
  if (firstTag > 0) {
    const before = text.slice(0, firstTag);
    if (!before.includes('<')) text = text.slice(firstTag);
  }
  const lastClose = text.lastIndexOf('>');
  if (lastClose !== -1 && lastClose < text.length - 1) {
    const after = text.slice(lastClose + 1).trim();
    if (after && !after.startsWith('<')) text = text.slice(0, lastClose + 1);
  }
  return text.trim();
}

/**
 * Generic enhancement (for individual sections like Experience/Projects)
 */
router.post('/enhance', authenticateJWT, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      message: 'AI enhancement is not configured. Please add GEMINI_API_KEY to your .env file.',
    });
  }

  try {
    const { html } = req.body;
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ message: 'html field is required.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are a professional resume editor. You will receive the description of a resume section as HTML.
Your task:
1. Fix grammar and spelling errors.
2. Elevate the tone to sound professional and achievement-oriented.
3. Use strong action verbs and quantify achievements where possible.
4. Preserve the exact HTML structure — keep all <ul>, <li>, <strong>, <em> tags.
5. Do NOT add, remove, or reorder bullet points.
6. Return ONLY the enhanced HTML. No explanation, no preamble, no markdown code fences.

Input HTML:
${html}`;

    const result = await model.generateContent(prompt);
    const cleaned = extractCleanHtml(result.response.text());
    res.json({ html: cleaned });

  } catch (error) {
    console.error('Gemini AI enhance error:', error?.message || error);
    const msg = error?.message?.includes('API_KEY_INVALID')
      ? 'Invalid GEMINI_API_KEY. Please check your server .env file.'
      : error?.message?.includes('QUOTA')
      ? 'Gemini API quota exceeded. Please try again later.'
      : 'AI enhancement failed. Please try again.';
    res.status(500).json({ message: msg });
  }
});

/**
 * Polish entire resume (fixes typos and grammar across all fields)
 */
router.post('/polish-resume', authenticateJWT, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      message: 'AI enhancement is not configured. Please add GEMINI_API_KEY to your .env file.',
    });
  }

  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ message: 'resumeData is required.' });
    }

    // Prepare a stripped-down JSON to send to Gemini to save tokens and prevent schema corruption
    const extract = {
      personalDetails: {
        name: resumeData.personalDetails?.name || '',
        location: resumeData.personalDetails?.location || '',
      },
      education: (resumeData.education || []).map(e => ({
        institution: e.institution, location: e.location, degree: e.degree
      })),
      experience: (resumeData.experience || []).map(e => ({
        company: e.company, location: e.location, role: e.role, description: e.description
      })),
      projects: (resumeData.projects || []).map(p => ({
        title: p.title, technologies: p.technologies, description: p.description
      })),
      skills: (resumeData.skills || []).map(s => ({
        category: s.category, items: s.items
      })),
      achievements: (resumeData.achievements || []).map(a => ({
        title: a.title, organization: a.organization, description: a.description
      })),
      hobbies: (resumeData.hobbies || []).map(h => ({
        name: h.name, role: h.role
      }))
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `You are an expert proofreader. I am providing a JSON object containing text from a user's resume.
Your task is ONLY to fix spelling mistakes, typos, and grammatical errors in all text fields (including HTML description fields).
Do NOT rewrite the content extensively. Do NOT change the structure of the JSON. Do NOT change the HTML structure (preserve all tags).
Simply fix typos and grammar. If a field is already correct, leave it unchanged.

Return the exact same JSON structure with the corrected text values.

Input JSON:
${JSON.stringify(extract)}
`;

    const result = await model.generateContent(prompt);
    let correctedText = result.response.text().trim();
    if (correctedText.startsWith('```json')) {
      correctedText = correctedText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (correctedText.startsWith('```')) {
      correctedText = correctedText.replace(/^```/, '').replace(/```$/, '').trim();
    }
    
    // Parse the corrected JSON
    const correctedData = JSON.parse(correctedText);

    // Merge the corrected fields back into the original resume data
    const merged = { ...resumeData };

    if (correctedData.personalDetails) {
      merged.personalDetails = { ...merged.personalDetails, ...correctedData.personalDetails };
    }
    
    ['education', 'experience', 'projects', 'skills', 'achievements', 'hobbies'].forEach(section => {
      if (correctedData[section] && Array.isArray(correctedData[section])) {
        merged[section] = merged[section].map((item, idx) => {
          if (correctedData[section][idx]) {
            return { ...item, ...correctedData[section][idx] };
          }
          return item;
        });
      }
    });

    res.json({ resume: merged });

  } catch (error) {
    console.error('Gemini AI polish error:', error?.message || error);
    res.status(500).json({ message: 'Failed to polish resume. Please try again.' });
  }
});

module.exports = router;
