require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const whatsappRoutes = require('./routes/whatsapp');
const needsRoutes = require('./routes/needs');
const organisationRoutes = require('./routes/organisations');
const adminRoutes = require('./routes/admin');
const deliveryRoutes = require('./routes/deliveries');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio sends form-encoded webhooks

// Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/needs', needsRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`FlowAid backend running on port ${PORT}`);
});

module.exports = app;
