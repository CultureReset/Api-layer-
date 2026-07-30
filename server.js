require('dotenv').config();

const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const entityRoutes = require('./routes/entities');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/entities', entityRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`api-layer listening on port ${port}`);
});
