/**
 * Zorvyn API — Express entry. Routes are thin; most logic lives in services/.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { AppError } = require('./lib/errors');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const financialRecordRoutes = require('./routes/financialRecordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'zorvyn-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/financial-records', financialRecordRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res, next) => {
  next(new AppError('Not found', 404));
});

app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Zorvyn API listening on port ${PORT}`);
});
