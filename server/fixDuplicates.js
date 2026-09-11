const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });
const Institute = require('../server/models/Institute');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const old = await Institute.find({ name: /\.(jpg|png|svg|webp|gif)$/i });
  console.log('Old count:', old.length);
  for (const doc of old) {
    const fixedName = doc.name.replace(/\.(jpg|png|svg|webp|gif)$/i, '');
    
    // Check if new one exists and delete the NEW one since no user used it yet
    const newOne = await Institute.findOne({ name: fixedName, category: doc.category, _id: { $ne: doc._id } });
    if (newOne) {
      await Institute.deleteOne({ _id: newOne._id });
    }
    
    doc.name = fixedName;
    await doc.save();
  }
  console.log('Fixed old documents and removed duplicates. Final count:', await Institute.countDocuments());
  mongoose.disconnect();
}
test();
