const logger = require('./startup/logging');
const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors({
  origin: 'https://bite-back-indol.vercel.app',
  credentials: true,
  exposedHeaders: ['x-auth-token']
}));

require('./startup/logging');
require('./startup/routes')(app);
require('./startup/prod')(app);
require('./startup/server')();
require('./startup/config')();
require('./startup/validation')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server;