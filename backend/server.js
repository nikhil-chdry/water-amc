require('dotenv').config();

const express          = require('express');
const mongoose         = require('mongoose');
const cors             = require('cors');
const path             = require('path');
const startReminderJob = require('./utils/reminderJob');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/service',   require('./routes/serviceRoutes'));
app.use('/api/payments',  require('./routes/paymentRoutes'));
app.use('/api/reports',   require('./routes/reportRoutes'));
app.use('/api/settings',  require('./routes/settingsRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.json({ message: '✅ Water AMC API is running!' });
});



const limiter = rateLimit({
  windowMs: 25 * 60 * 1000, // 25 minutes
  max:      100,             // 100 requests per window
  message:  { message: 'Too many requests, please try again later.' },
});

app.use('/api/', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 25 * 60 * 1000,
  max:      21, // only 21 login attempts per 25 min
  message:  { message: 'Too many login attempts, please try again later.' },
});

app.use('/api/auth/', authLimiter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' MongoDB connected');
    startReminderJob();
    app.listen(process.env.PORT, () => {
       console.log(` Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.log('❌ DB Error:', err));