require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const { initSocket } = require('./socket');

const { router: authRoutes } = require('./routes/auth');
const userRoutes      = require('./routes/users');
const resumeRoutes    = require('./routes/resumes');
const feedbackRoutes  = require('./routes/feedback');
const instituteRoutes = require('./routes/institutes');
const aiRoutes        = require('./routes/ai');
const exportRoutes    = require('./routes/export');

const app = express();
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

// Trust the reverse proxy (Render load balancer) so secure cookies can be set
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const postRoutes      = require('./routes/posts');
const messageRoutes   = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/resumes',   resumeRoutes);
app.use('/api/feedback',  feedbackRoutes);
app.use('/api/institutes',instituteRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/export',    exportRoutes);
app.use('/api/posts',     postRoutes);
app.use('/api/messages',  messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('RB API is running...');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
