require('dotenv').config();

const express          = require('express');
const mongoose         = require('mongoose');
const cors             = require('cors');
const startReminderJob = require('./utils/reminderJob');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/service',   require('./routes/serviceRoutes'));
app.use('/api/payments',  require('./routes/paymentRoutes'));
app.use('/api/reports',   require('./routes/reportRoutes'));

app.get('/', (req, res) => {
  res.json({ message: '✅ Water AMC API is running!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    startReminderJob();
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.log('❌ DB Error:', err));