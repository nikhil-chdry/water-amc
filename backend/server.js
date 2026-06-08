require('dotenv').config();

const express          = require('express');
const mongoose         = require('mongoose');
const cors             = require('cors');
const rateLimit        = require('express-rate-limit');
const startReminderJob = require('./utils/ReminderJob');

const app = express();
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: 'Too many requests' },
});
app.use('/api/', limiter);

// CORS — will add Vercel URL after deployment
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'https://water-amc-green.vercel.app',
      'https://water-amc-drab.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now during testing
    }
  },
  credentials: true,
}));

 

console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

app.use(express.json());

app.use('/api/auth',     require('./routes/AuthRoutes'));
app.use('/api/customers', require('./routes/CustomerRoutes'));
app.use('/api/service',   require('./routes/Serviceroutes'));
app.use('/api/payments',  require('./routes/PaymentRoutes'));
app.use('/api/reports',   require('./routes/ReportRoutes'));
app.use('/api/settings',  require('./routes/SettingsRoutes'));
app.use('/api/search',    require('./routes/SearchRoutes'));
app.use('/api/bills',     require('./routes/BillRoutes'));
app.use('/api/ai',        require('./routes/AiRoutes'));

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
  .catch(err => console.log(' DB Error:', err));
