require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Pet photos, medical reports and prescriptions
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Milo & Tails API' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/pets', require('./routes/pet.routes'));
app.use('/api/health-records', require('./routes/healthRecord.routes'));
app.use('/api/vaccinations', require('./routes/vaccination.routes'));
app.use('/api/providers', require('./routes/provider.routes'));
app.use('/api/services', require('./routes/service.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reminders', require('./routes/reminder.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/public', require('./routes/public.routes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Milo & Tails API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
