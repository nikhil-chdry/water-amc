require('dotenv').config();

const express          = require('express');
const mongoose         = require('mongoose');
const cors             = require('cors');
const rateLimit        = require('express-rate-limit');
const startReminderJob = require('./utils/reminderJob');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: 'Too many requests' },
});
app.use('/api/', limiter);

// CORS — will add Vercel URL after deployment
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/service',   require('./routes/serviceRoutes'));
app.use('/api/payments',  require('./routes/paymentRoutes'));
app.use('/api/reports',   require('./routes/reportRoutes'));
app.use('/api/settings',  require('./routes/settingsRoutes'));
app.use('/api/search',    require('./routes/searchRoutes'));
app.use('/api/bills',     require('./routes/billRoutes'));
app.use('/api/ai',        require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.json({ message: ' Water AMC API is running!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' MongoDB connected');
    startReminderJob();
    app.listen(process.env.PORT || 5000, () => {
      console.log(` Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.log('❌ DB Error:', err));