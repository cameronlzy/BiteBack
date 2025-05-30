const logger = require('./startup/logging');
const express = require('express');
const app = express();
const cors = require('cors');

const corsOptions = {
  origin: 'https://bite-back-cdw3ekse2-cameronlzys-projects.vercel.app',
  credentials: true,
  exposedHeaders: ['x-auth-token'],
};

app.use(cors(corsOptions));
app.options(/^\/.*$/, cors(corsOptions));

require('./startup/logging');
require('./startup/routes')(app);
require('./startup/prod')(app);
require('./startup/server')();
require('./startup/config')();
require('./startup/validation')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server;