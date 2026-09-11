const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetCompany: {
    type: String,
    required: true,
  },
  personalDetails: {
    name: String,
    title: String,
    photoUrl: String,
    email: String,
    phone: String,
    location: String,
  },
  education: [{
    institution: String,
    location: String,
    degree: String,
    duration: String,
    score: String,
  }],
  experience: [{
    company: String,
    location: String,
    role: String,
    duration: String,
    description: String,
    link: String,
  }],
  projects: [{
    title: String,
    description: String,
    technologies: String,
    duration: String,
    link: String,
  }],
  skills: [{
    category: String,
    items: String,
  }],
  achievements: [{
    title: String,
    organization: String,
    description: String,
    date: String,
  }],
  hobbies: [{
    name: String,
    role: String, // Optional
  }],
  hyperlinks: [{
    label: String,
    url: String,
  }],
  lastAtsScore: {
    score: Number,
    breakdown: [{ category: String, score: Number, note: String }],
    suggestions: [String],
    jobDescription: String,
    checkedAt: Date
  },
  layoutConfig: {
    templateId: { type: String, default: 'classic_ats' },
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
    typography: {
      bodyFontSize: { type: Number, default: 11 },
      headingFontSize: { type: Number, default: 14 },
      logoSize: { type: Number, default: 64 },
      photoSize: { type: Number, default: 64 },
      sectionSpacing: { type: Number, default: 8 },
    },
    positions: {
      logoPosition: { x: { type: Number, default: 620 }, y: { type: Number, default: 0 } },
      photoPosition: { x: { type: Number, default: 620 }, y: { type: Number, default: 0 } },
    },
    // Ordered list of sections
    sectionOrder: { 
      type: [String], 
      default: ['education', 'experience', 'projects', 'skills', 'achievements', 'hobbies'] 
    },
    hiddenSections: { type: [String], default: [] },
    sectionSpacings: {
      education:    { type: Number, default: 4 },
      experience:   { type: Number, default: 4 },
      projects:     { type: Number, default: 4 },
      skills:       { type: Number, default: 4 },
      achievements: { type: Number, default: 4 },
      hobbies:      { type: Number, default: 4 },
    },
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
