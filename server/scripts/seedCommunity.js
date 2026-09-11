require('dotenv').config({ path: __dirname + '/../.env' });
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

const seedData = [
  {
    content: `<h2>Top 3 Resume Mistakes to Avoid</h2>
    <p>1. <strong>Using paragraphs instead of bullets.</strong> Recruiters skim. Use bullet points.</p>
    <p>2. <strong>Including irrelevant hobbies.</strong> Keep it professional.</p>
    <p>3. <strong>Typos and Grammar.</strong> Always use the 'Enhance with AI' button before exporting!</p>`
  },
  {
    content: `<h2>How to quantify your achievements</h2>
    <p>Instead of saying "Improved server performance", say "Reduced server latency by 40% (from 200ms to 120ms) by optimizing MongoDB indexes, saving $5,000 in monthly AWS costs."</p>
    <p>Numbers make your impact concrete and credible.</p>`
  },
  {
    content: `<h2>Tailoring your resume for ATS</h2>
    <p>Applicant Tracking Systems (ATS) strip away complex formatting. Stick to standard headings like "Experience" and "Education". Use our Classic ATS template to ensure 100% parsability!</p>`
  }
];

const seedCommunity = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Look for an admin user to author the posts. If none, pick any user or create a dummy one.
    let admin = await User.findOne({ email: 'admin@resumebuilder.com' });
    if (!admin) {
      // Find the first user in the DB to act as admin, or create one if db is empty
      admin = await User.findOne();
      if (!admin) {
        admin = await User.create({
          googleId: 'admin_dummy',
          email: 'admin@resumebuilder.com',
          name: 'RB Admin',
          picture: 'https://ui-avatars.com/api/?name=RB+Admin'
        });
      }
    }

    for (const data of seedData) {
      // Avoid duplicating seeded posts
      const exists = await Post.findOne({ content: data.content });
      if (!exists) {
        await Post.create({
          author: admin._id,
          content: data.content,
        });
        console.log('Seeded a post.');
      }
    }

    console.log('Community seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedCommunity();
