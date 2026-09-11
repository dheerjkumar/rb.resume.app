
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find the old admin
  const admin = await User.findOne({ email: 'admin@resumebuilder.com' });
  if (admin) {
    admin.email = 'rb.resume.app@gmail.com';
    await admin.save();
    console.log('Fixed admin email!');
  } else {
    console.log('Admin not found. Already fixed?');
  }

  // Also fix the name 'RB Admin' to just 'Admin' or something? 
  // Let's leave it as is unless requested. The user just said 'not admin@resumebuilder.com'.

  mongoose.disconnect();
}
test();

