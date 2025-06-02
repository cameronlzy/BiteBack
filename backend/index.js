const logger = require('./startup/logging');
const express = require('express');
const cors = require('cors');
const app = express();

const corsOptions = {
  origin: 'https://bite-back-indol.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['x-auth-token'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

require('./startup/logging');
require('./startup/config')();
require('./startup/validation')();
require('./startup/prod')(app);
require('./startup/routes')(app);
require('./startup/server')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server;