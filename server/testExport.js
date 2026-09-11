require('dotenv').config();
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '6aa0dc265b7ed9138fe09186' }, process.env.JWT_SECRET);
async function test() {
  const res = await fetch('http://localhost:5000/api/export/latex', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      cookie: 'token=' + token 
    },
    body: JSON.stringify({ resumeId: '6aa0dc265b7ed9138fe09187' })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
