const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Institute = require('../models/Institute');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const seedInstitutes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding.');

    const logosDir = path.join(__dirname, '../seed-assets/logos');
    
    if (!fs.existsSync(logosDir)) {
      console.log(`Directory not found: ${logosDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(logosDir);
    console.log(`Found ${files.length} logo files.`);

    for (const file of files) {
      if (!file.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i)) {
        console.warn(`Skipping invalid file type: ${file}`);
        continue;
      }

      const filenameWithoutExt = path.parse(file).name;
      // Format: Category_Name e.g., IIT_Bombay
      const firstUnderscoreIdx = filenameWithoutExt.indexOf('_');
      
      let category = 'Other';
      let name = filenameWithoutExt;

      if (firstUnderscoreIdx !== -1) {
        category = filenameWithoutExt.substring(0, firstUnderscoreIdx);
        // Replace remaining underscores with spaces for the name
        name = filenameWithoutExt.substring(firstUnderscoreIdx + 1).replace(/_/g, ' ');
      }

      const existingInst = await Institute.findOne({ name, category });
      if (existingInst) {
        console.log(`Skipping ${name} (${category}) — already seeded.`);
        continue;
      }

      console.log(`Uploading ${file}...`);
      const result = await cloudinary.uploader.upload(path.join(logosDir, file), {
        folder: 'rb_institutes',
      });

      console.log(`Saving ${name} (${category}) to DB...`);
      await Institute.create({ name, category, logoUrl: result.secure_url });
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedInstitutes();
